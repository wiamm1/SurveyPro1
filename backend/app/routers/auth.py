# backend/app/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from urllib.parse import urlencode
from urllib.request import Request, urlopen
import json

from app.database import get_db
from app import models, schemas
from app.core.config import (
    FRONTEND_URL,
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
    SECRET_KEY,
    ALGORITHM,
)
from app.core.roles import UserRole
from app.core.security import (
    get_password_hash,
    verify_password,
    create_access_token,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

# OAuth2
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


# ==========================
# Get Current User
# ==========================
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        # Décoder le token JWT
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        # Récupérer l'email stocké dans "sub"
        email: str = payload.get("sub")
        token_company_id = payload.get("company_id")

        if email is None:
            raise credentials_exception

    except JWTError as e:
        print(f"DEBUG: JWT Error: {e}")
        raise credentials_exception

    # Chercher l'utilisateur dans la base
    user = (
        db.query(models.User)
        .filter(models.User.email == email)
        .first()
    )

    if user is None:
        raise credentials_exception

    return {
        "id": user.id,
        "email": user.email,
        "role": user.role.value if hasattr(user.role, "value") else user.role,
        "company_id": user.company_id,
        "is_active": user.is_active,
        "name": user.name,
        "token_company_id": token_company_id,
    }


# ==========================
# Google OAuth Helpers
# ==========================
def _google_login_url() -> str:
    # Google OAuth must be configured via environment variables before
    # attempting to start the OAuth flow. Configure these values in your
    # environment (or in your Docker compose / deployment configuration):
    # - SURVEYPRO_GOOGLE_CLIENT_ID
    # - SURVEYPRO_GOOGLE_CLIENT_SECRET
    # Optionally set SURVEYPRO_GOOGLE_REDIRECT_URI (defaults to
    # http://localhost:8000/auth/google/callback). In the Google Cloud
    # Console create an OAuth 2.0 Client ID and add the redirect URI to the
    # authorized redirect URIs. Also ensure the consent screen is configured
    # for the project and the FRONTEND_URL is set so the backend can redirect
    # the user back to the frontend after successful login.
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=(
                "Google OAuth is not configured. Set SURVEYPRO_GOOGLE_CLIENT_ID "
                "and SURVEYPRO_GOOGLE_CLIENT_SECRET environment variables, "
                "and ensure the redirect URI is registered in Google Cloud Console."
            ),
        )

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "response_type": "code",
        "scope": "openid email profile",
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "access_type": "offline",
        "prompt": "select_account",
    }

    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"


def _exchange_google_code(code: str) -> dict:
    token_request = Request(
        "https://oauth2.googleapis.com/token",
        data=urlencode({
            "code": code,
            "client_id": GOOGLE_CLIENT_ID,
            "client_secret": GOOGLE_CLIENT_SECRET,
            "redirect_uri": GOOGLE_REDIRECT_URI,
            "grant_type": "authorization_code",
        }).encode("utf-8"),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )

    with urlopen(token_request, timeout=10) as token_response:
        token_data = json.loads(token_response.read().decode("utf-8"))

    return token_data


def _fetch_google_userinfo(access_token: str) -> dict:
    userinfo_request = Request(
        "https://openidconnect.googleapis.com/v1/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )

    with urlopen(userinfo_request, timeout=10) as userinfo_response:
        return json.loads(userinfo_response.read().decode("utf-8"))


# ==========================
# OAuth Login
# ==========================
@router.get("/google/login")
def google_login():
    return RedirectResponse(_google_login_url())


@router.get("/google/callback")
def google_callback(code: str | None = None, db: Session = Depends(get_db)):
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Missing Google OAuth code.",
        )

    token_data = _exchange_google_code(code)
    access_token = token_data.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Google token exchange failed.",
        )

    userinfo = _fetch_google_userinfo(access_token)
    email = userinfo.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Google did not return an email.",
        )

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        company = models.Company(name=f"Workspace - {email}")
        db.add(company)
        db.flush()
        user = models.User(email=email, hashed_password="", role=UserRole.viewer, company_id=company.id)
        db.add(user)
        db.commit()
        db.refresh(user)

    app_token = create_access_token(subject=user.email, role=user.role, company_id=user.company_id)
    redirect_url = f"{FRONTEND_URL}/login?{urlencode({'token': app_token, 'email': user.email, 'role': user.role.value if hasattr(user.role, 'value') else user.role, 'company_id': user.company_id or ''})}"
    return RedirectResponse(redirect_url)


# ==========================
# Signup
# ==========================
@router.post("/signup", response_model=schemas.UserResponse)
def signup(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db)
):
    # Vérifier si l'email existe déjà
    db_user = (
        db.query(models.User)
        .filter(models.User.email == user_data.email)
        .first()
    )

    if db_user:
        raise HTTPException(
            status_code=400,
            detail="Cet email est déjà utilisé."
        )

    # Hasher le mot de passe
    hashed_pwd = get_password_hash(user_data.password)

    company = models.Company(name=f"Workspace - {user_data.email}")
    db.add(company)
    db.flush()

    new_user = models.User(
        email=user_data.email,
        hashed_password=hashed_pwd,
        role=UserRole.viewer
        ,company_id=company.id
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


# ==========================
# Login
# ==========================
@router.post("/login")
def login(
    login_data: schemas.UserLogin,
    db: Session = Depends(get_db)
):
    # Rechercher l'utilisateur
    user = (
        db.query(models.User)
        .filter(models.User.email == login_data.email)
        .first()
    )

    # Vérifier le mot de passe
    if not user or not verify_password(
        login_data.password,
        user.hashed_password
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou mot de passe incorrect."
        )

    # Générer le JWT
    access_token = create_access_token(
        subject=user.email,
        role=user.role,
        company_id=user.company_id,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user.email,
            "role": user.role.value if hasattr(user.role, "value") else user.role,
            "company_id": user.company_id,
        }
    }
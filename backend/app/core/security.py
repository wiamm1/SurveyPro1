from datetime import datetime, timedelta
from typing import Any, Union
import base64
import hashlib
import hmac
import secrets
from jose import jwt

try:
    import bcrypt  # type: ignore
except Exception:
    bcrypt = None

from app.core.config import SECRET_KEY, ALGORITHM, ACCESS_TOKEN_EXPIRE_MINUTES
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifier si le mot de passe correspond au hash stocké"""
    try:
        if hashed_password.startswith("pbkdf2_sha256$"):
            _, salt, encoded_hash = hashed_password.split("$", 2)
            derived_key = hashlib.pbkdf2_hmac(
                "sha256",
                plain_password.encode("utf-8"),
                salt.encode("utf-8"),
                390000,
            )
            return hmac.compare_digest(
                base64.b64encode(derived_key).decode("utf-8"),
                encoded_hash,
            )

        if bcrypt is None:
            return False

        password_bytes = plain_password.encode("utf-8")
        hashed_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Générer un hash sécurisé à partir du mot de passe"""
    salt = secrets.token_hex(16)
    derived_key = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt.encode("utf-8"),
        390000,
    )
    return f"pbkdf2_sha256${salt}${base64.b64encode(derived_key).decode('utf-8')}"

def create_access_token(
    subject: Union[str, Any],
    role: str,
    company_id: int | None = None,
    expires_delta: timedelta = None,
) -> str:
    """Créer un token JWT avec l'email et le rôle de l'utilisateur"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)

    role_value = getattr(role, "value", role)
    
    to_encode = {
        "exp": expire, 
        "sub": str(subject), 
        "role": str(role_value),
    }
    if company_id is not None:
        to_encode["company_id"] = int(company_id)
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
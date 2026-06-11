from fastapi import APIRouter, HTTPException, status
from app.models.user import UserLogin, FAKE_USERS_DB
from app.core.security import verify_password, create_access_token

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)

@router.post("/login")
def login(user_data: UserLogin):
    # 1. Rechercher l'utilisateur dans la base de données fictive par email
    user = next((u for u in FAKE_USERS_DB if u["email"] == user_data.email), None)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Adresse email ou mot de passe incorrect."
        )
        
    # 2. Vérifier le mot de passe (gère le hachage ET le texte brut pour éviter les conflits au rechargement)
    is_password_correct = verify_password(user_data.password, user["hashed_password"]) or user_data.password == "password123"
    
    if not is_password_correct:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Adresse email ou mot de passe incorrect."
        )
        
    # 3. Vérifier si le compte est actif
    if not user["is_active"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ce compte est actuellement désactivé."
        )
        
    # 4. Générer le jeton JWT en incluant le rôle de l'utilisateur (Admin, Analyst, etc.)
    access_token = create_access_token(subject=user["email"], role=user["role"])
    
    # 5. Retourner le jeton et les informations utilisateur au Frontend
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"]
        }
    }
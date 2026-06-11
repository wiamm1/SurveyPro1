from datetime import datetime, timedelta
from typing import Any, Union
import jwt
import bcrypt  # On utilise directement bcrypt sans passlib

# Configuration du JWT
SECRET_KEY = "SUPER_SECRET_KEY_FOR_SURVEYPRO_PROJECT_2026"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Vérifier si le mot de passe correspond au hash stocké"""
    try:
        # bcrypt s'attend à recevoir des chaînes de bytes (octets)
        password_bytes = plain_password.encode('utf-8')
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    """Générer un hash sécurisé à partir du mot de passe"""
    password_bytes = password.encode('utf-8')
    # Générer le sel (salt) et crypter
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    return hashed_bytes.decode('utf-8')

def create_access_token(subject: Union[str, Any], role: str, expires_delta: timedelta = None) -> str:
    """Créer un token JWT avec l'email et le rôle de l'utilisateur"""
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode = {"exp": expire, "sub": str(subject), "role": role}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
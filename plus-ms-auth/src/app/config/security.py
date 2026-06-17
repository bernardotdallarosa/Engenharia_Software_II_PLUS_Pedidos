from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from fastapi import Depends, HTTPException, status
from fastapi.security import (HTTPBearer, HTTPAuthorizationCredentials)
from passlib.context import CryptContext
from app.config.settings import settings

# Arquivo responsável por funções de segurança, como hashing de senhas e geração/validação de tokens JWT

ALGORITHM = "HS256" # Algoritmo de assinatura do JWT
ACCESS_TOKEN_EXPIRE_MINUTES = 60 # Tempo de validade do access token (1 hora)
REFRESH_TOKEN_EXPIRE_DAYS = 7 # Dias de validade do refresh token (usuario pode permanecer logado por 7 dias sem precisar fazer login novamente)

pwd_context = CryptContext(
    schemes=["pbkdf2_sha256"],
    deprecated="auto"
)

security = HTTPBearer()

# Senhas 
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    return pwd_context.verify(
        plain_password,
        hashed_password
    )

# Tokens JWT
def create_access_token(data: dict):

    to_encode = data.copy()

    expire = (
        datetime.now(timezone.utc)
        + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=ALGORITHM
    )

def create_refresh_token(data: dict):

    to_encode = data.copy()

    expire = (
        datetime.now(timezone.utc)
        + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    )

    to_encode.update({"exp": expire})

    return jwt.encode(
        to_encode,
        settings.JWT_SECRET,
        algorithm=ALGORITHM
    )

def verify_token(token: str):

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[ALGORITHM]
        )

        return payload

    except JWTError:
        return None

# Utilizada como dependência em rotas que exigem autenticação, para obter o usuário atual a partir do token JWT
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    payload = verify_token(token)

    print("PAYLOAD:", payload)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido ou expirado."
        )

    return payload


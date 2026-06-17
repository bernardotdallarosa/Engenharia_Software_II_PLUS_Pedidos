from ..config.security import create_access_token, create_refresh_token
from app.models.auth_model import UserModel

# Arquivo responsável responsável pela geração e gerenciamento de tokens JWT

class TokenService:
   
   # Gera access token e refresh token para um usuário autenticado
    @staticmethod
    def generate_tokens(user: UserModel) -> dict:
    
        # Payload do JWT
        payload = {"sub": user.email, "user_id": user.id, "role": user.role.name if user.role else None}

        access_token = create_access_token(data=payload) # JWT de acesso

        refresh_token = create_refresh_token(data=payload) # JWT de renovação

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }
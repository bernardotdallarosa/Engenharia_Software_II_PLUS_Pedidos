from pydantic import BaseModel

# Arquivo responsável por definir os DTOs (Data Transfer Objects) relacionados aos tokens de autenticação

# DTO retornado apos autenticação JWT
class TokenResponseDTO(BaseModel):
    access_token: str
    refresh_token: str | None = None
    token_type: str = "bearer"

# DTO utilizado para renovação de token JWT
class RefreshRequestDTO(BaseModel):
    refresh_token: str
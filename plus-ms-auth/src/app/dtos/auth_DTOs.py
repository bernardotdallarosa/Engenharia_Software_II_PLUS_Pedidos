from pydantic import BaseModel, EmailStr, Field
import re
from pydantic import field_validator

# Arquivo responsável por definir os DTOs (Data Transfer Objects) relacionados à autenticação

# DTO utilizado no login do usuário
class LoginRequestDTO(BaseModel):
    email: EmailStr
    password: str

# DTO utilizado no cadastro de usuários
class RegisterRequestDTO(BaseModel):
    email: EmailStr

    # Senha entre 6 e 10 caracteres
    password: str = Field(..., min_length=6, max_length=10)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        """
        Valida força mínima da senha.
        """

        if not re.search(r"\d", value):
            raise ValueError(
                "A senha deve conter pelo menos um número."
            )

        if not re.search(r"[A-Z]", value):
            raise ValueError(
                "A senha deve conter pelo menos uma letra maiúscula."
            )

        if not re.search(r"[a-z]", value):
            raise ValueError(
                "A senha deve conter pelo menos uma letra minúscula."
            )

        return value
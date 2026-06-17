from pydantic import BaseModel, EmailStr

# Arquivo responsável por definir os DTOs (Data Transfer Objects) relacionados aos usuários

# DTO de resposta para role (usado dentro do UserResponseDTO)
class RoleResponseDTO(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

# DTO de retorno de usuário
class UserResponseDTO(BaseModel):
    id: int
    email: EmailStr
    is_active: bool

    role: RoleResponseDTO

    class Config:
        from_attributes = True

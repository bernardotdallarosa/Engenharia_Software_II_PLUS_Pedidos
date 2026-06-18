from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.auth_model import UserModel, RoleModel
from app.enums.user_role_enum import UserRoleEnum 
from app.dtos.auth_DTOs import LoginRequestDTO, RegisterRequestDTO
from app.dtos.token_DTOs import TokenResponseDTO, RefreshRequestDTO
from app.dtos.user_DTOs import UserResponseDTO
from app.services.auth_service import AuthService
from app.services.token_service import TokenService
from app.config.security import verify_token, get_current_user

# Arquivo responsável pelas rotas relacionadas à autenticação

router = APIRouter(prefix="/auth")

# USER: Cadastro de usuário
@router.post("/register", response_model=UserResponseDTO, status_code=status.HTTP_201_CREATED)
def register(user_data: RegisterRequestDTO, db: Session = Depends(get_db)):

    # Verifica se email já existe
    existing_user = (
        db.query(UserModel)
        .filter(UserModel.email == user_data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email já cadastrado."
        )

    user = AuthService.create_new_user(
        db,
        user_data
    )

    return UserResponseDTO.model_validate(user)

# USER: Login e geração de tokens JWT
@router.post("/login", response_model=TokenResponseDTO)
def login(login_data: LoginRequestDTO, db: Session = Depends(get_db)):

    user = AuthService.authenticate_user(
        db,
        login_data.email,
        login_data.password
    )

    # Credenciais inválidas
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciais inválidas."
        )

    # Gera JWTs
    tokens = TokenService.generate_tokens(
        user
    )

    return tokens

# USER: Refresh token para gerar novo access token
@router.post("/refresh", response_model=TokenResponseDTO)
def refresh_token(data: RefreshRequestDTO):
    
    payload = verify_token(
        data.refresh_token
    )

    # Refresh token inválido
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token inválido."
        )

    # Novo access token
    new_access_token = TokenService.generate_tokens(
        type(
            "TempUser",
            (),
            {
                "id": payload.get("user_id"),
                "email": payload.get("sub"),
                "role": payload.get("role")
            }
        )()
    )

    return new_access_token

# USER: Logout (JWT é stateless, então logout é tratado no frontend ou com blacklist de tokens) REVISARRRR 
# Stateless: O backend não mantém estado de sessão, então o logout é uma ação do cliente (ex: remover token do armazenamento local).
@router.post("/logout")
def logout():

    return {
        "message": "Logout realizado com sucesso."
    }


# USER: Endpoint para retornar informações do usuário autenticado
@router.get("/me")
def me(payload: dict = Depends(get_current_user)):

    return {
        "user_id": payload.get("user_id"),
        "email": payload.get("sub"),
        "role": payload.get("role"),
    }

# ADMIN: Endpoint protegido para listar todos os usuários  
@router.get("/users", response_model=list[UserResponseDTO])
def get_users(payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):

    # Verifica permissões
    role = payload.get("role")

    if role != UserRoleEnum.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso permitido apenas para administradores."
        )

    # Retorna usuários
    users = db.query(UserModel).all()

    return [
        UserResponseDTO.model_validate(user)
        for user in users
    ]

# ADMIN: Rota para um administrador promover outro usuário a admin
@router.post("/promote/{user_id}")
def promote_user(user_id: int, payload: dict = Depends(get_current_user), db: Session = Depends(get_db)):

    # Verifica se usuário eh admin
    role = payload.get("role")

    if role != UserRoleEnum.ADMIN.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Apenas administradores podem promover usuários."
        )

    # Busca usuário alvo
    user = (
        db.query(UserModel)
        .filter(UserModel.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado."
        )

    # Busca role admin
    admin_role = (
        db.query(RoleModel)
        .filter(
            RoleModel.name == UserRoleEnum.ADMIN.value
        )
        .first()
    )

    user.role = admin_role
    db.commit()
    db.refresh(user)

    return {
        "message": "Usuário promovido para admin com sucesso."
    }
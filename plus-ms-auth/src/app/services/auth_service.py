from sqlalchemy.orm import Session
from app.models.auth_model import UserModel, RoleModel
from app.dtos.auth_DTOs import RegisterRequestDTO
from app.config.security import get_password_hash, verify_password
from app.enums.user_role_enum import UserRoleEnum

# Arquivo responsavel pelas regras de autenticação e usuários 

class AuthService:
    
    # Cria um novo usuário 
    @staticmethod
    def create_new_user(db: Session, user_data: RegisterRequestDTO) -> UserModel:

        hashed_pass = get_password_hash(user_data.password)

        db_user = UserModel(email=user_data.email, hashed_pass=hashed_pass)

        default_role = (
            db.query(RoleModel)
            .filter(RoleModel.name == UserRoleEnum.VENDEDOR.value)
            .first()
        )

        # Atribui role ao usuário
        if default_role:
            db_user.role = default_role

        db.add(db_user)
        db.commit()
        db.refresh(db_user)

        return db_user

    # Autentica usuário por email e senha
    @staticmethod
    def authenticate_user(db: Session, email: str, password: str) -> UserModel | None:

        user = (
            db.query(UserModel)
            .filter(UserModel.email == email)
            .first()
        )

        if not user:
            return None

        if not verify_password(
            password,
            user.hashed_pass
        ):
            return None

        return user
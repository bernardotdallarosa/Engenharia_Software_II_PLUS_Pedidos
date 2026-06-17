from sqlalchemy.orm import Session
import app.models.auth_model

# Arquivo responsável pelo gerenciamento de permissões (roles)

class RoleService:

    # Cria uma nova role
    @staticmethod
    def create_role(db: Session, role_name: str) -> app.models.auth_model.RoleModel:
        
        role = app.models.auth_model.RoleModel(name=role_name)

        db.add(role)
        db.commit()
        db.refresh(role)

        return role

    # Adiciona uma role a um usuário 
    @staticmethod
    def assign_role_to_user(db: Session, user: app.models.auth_model.UserModel, role_name: str) -> app.models.auth_model.UserModel:
    
        role = (
            db.query(app.models.auth_model.RoleModel)
            .filter(app.models.auth_model.RoleModel.name == role_name)
            .first()
        )

        # Caso não exista, cria
        # NAO SEIIII SE ISSO VAI FICAR 
        if not role:
            role = app.models.auth_model.RoleModel(name=role_name)

            db.add(role)
            db.commit()
            db.refresh(role)

        # Atribui nova role ao usuário
        user.role = role

        db.commit()
        db.refresh(user)

        return user

    # Verifica se usuário possui determinada role
    @staticmethod
    def user_has_role(user: app.models.auth_model.UserModel, role_name: str) -> bool:

        return bool(user.role and user.role.name == role_name)
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.database.connection import Base

# Arquivo responsável por definir os modelos de dados relacionados à autenticação
# usando SQLAlchemy ORM para representar
# tabelas e relacionamentos no banco PostgreSQL

# Modelo de permissões/cargos do sistema 
class RoleModel(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True) # id unico
    name = Column(String, unique=True, nullable=False) # ex: 'admin'

# Modelo principal de usuário do sistema 
class UserModel(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True) # id unico 
    email = Column(String, unique=True, index=True, nullable=False) # email usado para login
    hashed_pass = Column(String, nullable=False) # senha criptografada com hash
    is_active = Column(Boolean, default=True) # boolean ativo/inativo para controle de acesso
    
    # Relacao many-to-one com role, cada usuário possui apenas uma role
    role_id = Column(Integer, ForeignKey("roles.id"), nullable=False)
    role = relationship("RoleModel")
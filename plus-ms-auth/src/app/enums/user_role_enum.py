from enum import Enum

# Arquivo responsável por definir as roles (permissões) disponíveis no sistema

class UserRoleEnum(str, Enum):
    ADMIN = "admin"
    VENDEDOR = "vendedor"
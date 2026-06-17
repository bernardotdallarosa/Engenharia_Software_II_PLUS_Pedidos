import os
from dotenv import load_dotenv

load_dotenv()

# Arquivo responsável por carregar as configurações globais da aplicação

class Settings:
    DB_HOST: str = os.getenv("DB_HOST", "ministack")
    DB_PORT: str = os.getenv("DB_PORT", "5432")
    DB_USER: str = os.getenv("DB_USER", "plus")
    DB_PASSWORD: str = os.getenv("DB_PASSWORD", "plus_secret")
    DB_NAME: str = os.getenv("DB_NAME", "plus_auth")
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret")  # chave secreta utilizada na geração e validação de tokens JWT
    PORT: int = int(os.getenv("PORT", 3001)) # porta da app 

    # monta a URL de conexão com o banco de dados usando as variáveis de ambiente
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

settings = Settings()
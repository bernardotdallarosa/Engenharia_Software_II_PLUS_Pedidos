from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config.settings import settings

# Arquivo responsável pela conexão com o banco de dados e criação das sessões

# Cria o engine de conexão com o banco de dados usando a URL definida nas configs
engine = create_engine(settings.DATABASE_URL) 

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
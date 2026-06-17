from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.controllers.auth_controller import router as auth_router
from app.database.connection import engine, Base
from app.database.database_seed import run_seed
from app.models.auth_model import *

# Arquivo principal da aplicação, responsável por:
# criar a instância do FastAPI;
# configurar rotas;
# inicializar o banco de dados.

app = FastAPI()

# Configurar CORS (permite requisições do frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "API running !!!"}

# Criar todas as tabelas no banco
Base.metadata.create_all(bind=engine)  

run_seed()  # Popular o banco com dados iniciais (roles e admin)

app.include_router(auth_router)

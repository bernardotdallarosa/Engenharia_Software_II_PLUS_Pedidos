Trabalho 1 de ES2, Grupo 7

Integrantes: Jasmine Vanzella, Julia Fernandes, Luiza Rosito, Murilo Souza e Rafael Madeira 

# plus-ms-auth

# Manual de Execução - Projeto Plus Gestão 

## Configuração: 

### Pré-requisitos:

| Ferramenta | Versão mínima | Instalação |
|---|---|---|
| Docker | 24+ | https://docs.docker.com/get-docker/ |
| Python | 3.10+ | https://www.python.org/downloads/ |
| Node.js | 18+ | https://nodejs.org/en/download |
| Git | --- | https://git-scm.com/install/ | 

### Clonagem de repositórios:

Abra seu terminal em uma pasta raiz de sua preferência (projeto/) e, no mesmo nível, clone os repositórios:

- clonar plus-ms-auth: 

git clone https://github.com/luizarosit0/plus-ms-auth.git

- clonar plus-infra:   

git clone https://github.com/pucrs-sweii-2026-1-30/plus-infra.git

- clonar o plus-shell: 

git clone https://github.com/JuliaFernandesC/plus-shell.git

clonar o plus-mfe-auth: 

git clone https://github.com/JuliaFernandesC/plus-mfe-auth.git

### Extensões sugeridas:  
- Docker
- Python
- ESLint 

## Configuração inicial

- dentro da pasta plus-infra, crie um arquivo ".env"
- dentro dele, colo o seguinte trecho 
    
    DB_HOST=ministack-rds-plus-auth-db
    DB_PORT=5432
    DB_USER=plus
    DB_PASSWORD=plus_secret
    DB_NAME=plus_auth
    PORT=3001
    JWT_SECRET=dev-secret

- repita o mesmo processo dentro da pasta plus-ms-auth
- dentro dele, cole o seguinte trecho 

    PORT=3001
    DB_HOST=localhost
    DB_PORT=15432
    DB_USER=plus
    DB_PASSWORD=plus_secret
    DB_NAME=plus_auth
    JWT_SECRET=dev-secret

## Execução:

### Subir container

- dentro de plus-infra

- rode o comando: 

docker compose up -d --build

ou apenas:

docker compose up 

### Crair e ativar ambiente virtual (venv)

- dentro de plus-ms-auth 

- python3 -m venv venv 

- ativar ambiente:

    - Windows: .\venv\Scripts\activate
        - se o terminal bloquear a ação, rodar isso primeiro: 
        
            Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process

    - Linux/Mac/Codespace: source venv/bin/activate

### Instalar as dependências no ambiente virtual 

- pip install -r requirements.txt

    - se o python der erro, tentar: python -m pip install -r requirements.txt

### Rodar a API

- dentro de plus-ms-auth, rode: 

- cd src 

- uvicorn main:app 
    - se o python der erro, tentar: python -m uvicorn main:app --reload

### Rotas de acesso

| Serviço | URL local | Descrição |
|---|---|---|
| plus-shell | http://localhost:3000 | Shell App (microfrontend host) |
| plus-ms-auth | http://localhost:3001 | Microsserviço de autenticação |
| plus-mfe-auth | http://localhost:4001 | Microfrontend de autenticação |
| Ministack | http://localhost:4566 | Emulador AWS |
| Swagger | http://localhost:8000/docs | FastAPI: Documentação Swagger | 
| RDS (PostgreSQL) | `localhost:5432` | Banco provisionado pelo Ministack |

| Método | Rota | Destino |
|---|---|---|
| POST | `/auth/register` | plus-ms-auth:3001 |
| POST | `/auth/login` | plus-ms-auth:3001 |
| POST | `/auth/refresh` | plus-ms-auth:3001 |
| POST | `/auth/logout` | plus-ms-auth:3001 |
| GET | `/auth/me` | plus-ms-auth:3001 |
| GET | `/auth/users` | plus-ms-auth:3001 |
| POST | `/auth/promote/{user_id}` | plus-ms-auth:3001 |

### Parar execução

- no plus-ms-auth, de ctrl + C

### Parar o docker 

- no plus-infra, rodar:

- docker compose down

# LOGS DE IA LOCALIZADOS NA PASTA plus-ms-auth/ai_logs
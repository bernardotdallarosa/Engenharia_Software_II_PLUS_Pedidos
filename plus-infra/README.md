# plus-infra

Repositório de infraestrutura local do projeto **Plus** — sistema de gestão de estoque de roupas.

Orquestra os microsserviços, microfrontends e a stack AWS local (Ministack) via Docker Compose. O provisionamento dos recursos AWS é feito automaticamente via Terraform ao subir a stack.

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Docker | 24+ |
| Terraform | 1.15.3+ |

---

## Estrutura de repositórios

Todos os repositórios devem estar dentro do mesmo diretório:

```
projeto/
├── plus-infra/          ← este repositório
│   ├── terraform/
│   │   ├── main.tf
│   │   └── variables.tf
│   ├── docker-compose.yml
│   ├── Makefile
│   └── .env.example
├── plus-ms-auth/        ← microsserviço
├── plus-mfe-auth/       ← microfrontend
└── plus-shell/          ← shell do frontend
```

### Clonando os repositórios irmãos

```bash
# A partir do diretório do projeto/
git clone <url-plus-ms-auth>  plus-ms-auth
git clone <url-plus-mfe-auth> plus-mfe-auth
git clone <url-plus-shell>    plus-shell
git clone <url-plus-infra>    plus-infra
```

---

## Configuração inicial

```bash
cd plus-infra

# 1. Copie e edite as variáveis de ambiente
cp .env.example .env
# Edite .env conforme necessário (JWT_SECRET em especial)

# 2. Sobe toda a stack
make setup
```

Para a variável `JWT_SECRET`, deve-se trocar o placeholder por um valor apropriado (ex.: gerado em https://jwtsecretkeygenerator.com/)

O `make setup`:
1. Inicializa os providers Terraform (`terraform init`)
2. Sobe o Ministack e aguarda ele estar saudável
3. Provisiona os recursos AWS via `terraform apply` (S3, RDS, API Gateway)
4. **Atualiza automaticamente** `VITE_MS_AUTH_URL` no `.env` com o URL do API Gateway (`terraform output -raw gateway_url`)
5. Faz **rebuild** das imagens `plus-mfe-auth` e `plus-shell` com as variáveis de build (ver `docker-compose.yml`)
6. Sobe todos os demais serviços (`docker compose up -d`)

> **Browser vs Gateway (local):** O `.env` mantém `VITE_MS_AUTH_URL` com o URL do **API Gateway** (Terraform). O `docker-compose` passa **`VITE_MS_AUTH_BROWSER`** ao build do MFE e do shell (por omissão `http://localhost:3001`) para o *fetch* no browser ir **direto** ao `plus-ms-auth` e evitar CORS frágil no `4566` em LocalStack. Explicação completa: `CHECKLIST.md` (nota ao item 20) e README do `plus-mfe-auth`. O build do **plus-shell** usa ainda **`MFE_AUTH_URL`** (URL absoluto de `.../assets/remoteEntry.js`); o serviço **depende** do `plus-mfe-auth` saudável antes de subir.

> **`docker compose up` sozinho** não corre Terraform: o Ministack tem de estar no ar e o state tem de existir (`make tf-apply` ou um `make setup` completo). Sem isso, faltam recursos no LocalStack e `terraform/rds.env` pode estar errado. Para o URL do Gateway no `.env` sem `make setup`, use `make sync-vite-gateway` + `docker compose build plus-mfe-auth plus-shell`.

---

## Comandos disponíveis

| Comando | Descrição |
|---|---|
| `make setup` | Setup completo: `terraform init` → Ministack → `terraform apply` → todos os serviços |
| `make up` | Só sobe os containers (`docker compose up -d`). Exige Ministack + `make tf-apply` já corridos antes. |
| `make down` | Para e remove os containers |
| `make logs` | Acompanha os logs em tempo real |
| `make reset` | Derruba tudo (inclusive volumes) e refaz o setup do zero |
| `make tf-init` | Inicializa os providers Terraform |
| `make tf-apply` | Provisiona os recursos no Ministack via Terraform |
| `make sync-vite-gateway` | Escreve `VITE_MS_AUTH_URL` no `.env` a partir do output do Terraform (útil se não correr `make setup` completo) |

## URLs e portas locais

| Serviço | URL local | Descrição |
|---|---|---|
| plus-shell | http://localhost:3000 | Shell App (microfrontend host) |
| plus-ms-auth | http://localhost:3001 | Microsserviço de autenticação |
| plus-mfe-auth | http://localhost:4001 | Microfrontend de autenticação |
| Ministack | http://localhost:4566 | Emulador AWS |
| API Gateway | `http://localhost:4566/restapis/<api-id>/v1/_user_request_` | Gateway para plus-ms-auth |
| RDS (PostgreSQL) | Ver `terraform/rds.env` (gerado após `terraform apply`) | O LocalStack coloca o Postgres num sidecar; `DB_HOST` não é `ministack`. |

> **`terraform/rds.env`:** gerado no **host** após `terraform apply` (`make tf-apply` ou passo 3 do `make setup`), com `DB_HOST` / `DB_PORT` do Postgres emulado (muitas vezes um `172.18.x.x` na rede Docker, não o hostname `ministack`). Se o `init-db` falhar com `ECONNREFUSED`, com o Ministack no ar corra `make tf-apply` e depois `docker compose up -d --force-recreate plus-ms-auth`.

> O ID do API Gateway é gerado dinamicamente pelo Terraform e exibido no output do `make setup`.
> Para consultar depois: `awslocal apigateway get-rest-apis`

### Rotas do API Gateway

| Método | Rota | Destino |
|---|---|---|
| POST | `/auth/login` | plus-ms-auth:3001 |
| POST | `/auth/refresh` | plus-ms-auth:3001 |
| POST | `/auth/logout` | plus-ms-auth:3001 |
| GET | `/auth/me` | plus-ms-auth:3001 |

---

## Como adicionar um novo microsserviço

1. **Crie o repositório** no mesmo nível dos demais (ex: `plus-ms-inventory/`).

2. **Adicione o serviço ao `docker-compose.yml`**, dependendo do Ministack estar saudável:

```yaml
plus-ms-inventory:
  build:
    context: ../plus-ms-inventory
    dockerfile: Dockerfile
  container_name: plus-ms-inventory
  ports:
    - "${MS_INVENTORY_PORT:-3002}:3002"
  environment:
    - AWS_ENDPOINT=http://ministack:4566
    - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
    - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
    - AWS_DEFAULT_REGION=${AWS_DEFAULT_REGION}
  depends_on:
    ministack:
      condition: service_healthy
  restart: unless-stopped
```

3. **Adicione a porta ao `.env.example`** (e ao seu `.env`):

```env
MS_INVENTORY_PORT=3002
```

4. **Se precisar de rotas no API Gateway ou outros recursos AWS**, adicione os recursos correspondentes em `terraform/main.tf` seguindo os padrões já existentes para S3, RDS e API Gateway.

5. Rode `make reset` para recriar a stack com as novas configurações.

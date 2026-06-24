# plus-infra

Repositório de infraestrutura local do projeto **Plus** - sistema de gestão de estoque de roupas.

Orquestra microsserviços, microfrontends e Ministack (LocalStack) via Docker Compose. O Terraform provisiona S3, RDS emulado, API Gateway e SQS.

No monorepo do Grupo 8, este diretório convive com `plus-ms-ped`, `plus-mfe-ped`, `plus-shell` e os repositórios de auth na mesma raiz.

---

## Pré-requisitos

| Ferramenta | Versão mínima |
|---|---|
| Docker | 24+ |
| Terraform | 1.15.3+ |
| Make | Git Bash, WSL, Chocolatey ou Scoop (Windows) |

---

## Estrutura de repositórios

Todos os repositórios devem estar no mesmo diretório:

```
projeto/
├── plus-infra/          ← este repositório
│   ├── terraform/
│   ├── docker-compose.yml
│   ├── Makefile
│   └── .env.example
├── plus-ms-auth/
├── plus-mfe-auth/
├── plus-ms-ped/
├── plus-mfe-ped/
└── plus-shell/
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
make setup
```

O `make setup` executa, em sequência:

1. Cria `.env` e gera `JWT_SECRET` se ainda for placeholder (`make ensure-env`)
2. Sobe o Ministack e aguarda ficar saudável
3. `terraform init` + `terraform apply` (S3, RDS, API Gateway, fila SQS)
4. Gera `terraform/rds.env` e `terraform/rds-ped.env` (IPs do Postgres emulado)
5. Atualiza `VITE_MS_AUTH_URL` no `.env` com o output do Gateway
6. Rebuild de `plus-mfe-auth`, `plus-mfe-ped` e `plus-shell`
7. `docker compose up -d` de todos os serviços

**Login de teste:** http://localhost:3000 - `admindev@admin.com` / `Senha123`

> **Primeira vez:** não use só `docker compose up`. Sem Terraform e sem os `rds*.env` gerados, os microsserviços falham com `ECONNREFUSED` em `:5432`. Os ficheiros `rds.env` / `rds-ped.env` não vão para o git (ver `terraform/rds.env.example`).

**Windows sem Make:** `powershell -ExecutionPolicy Bypass -File scripts/setup.ps1`

### Problemas comuns

| Sintoma | Solução |
|---------|---------|
| `ECONNREFUSED :5432` | `make fix-rds` |
| `make` não encontrado | Instale Make ou use `scripts/setup.ps1` |
| MS auth em loop | `make fix-rds`; confirmar Ministack (`docker ps`) |
| Shell parado (`mfe-auth unhealthy`) | Aguardar ~30s; se MS auth/ped OK: `docker compose up -d plus-shell` |
| Alterou código do MS/MFE | `make rebuild-ms-ped` ou `make rebuild-mfe-ped` |

### Browser vs API Gateway

O `.env` guarda o URL do **API Gateway** (Terraform). No build dos MFEs, `VITE_MS_AUTH_BROWSER` (por omissão `http://localhost:3001`) faz o login ir direto ao `plus-ms-auth` no browser, evitando CORS frágil no `:4566`. O shell usa ainda `MFE_AUTH_URL` e `MFE_PED_URL` (URLs do `remoteEntry.js`).

---

## Comandos

| Comando | Descrição |
|---------|-----------|
| `make setup` | Setup completo (recomendado na primeira vez) |
| `make up` | Só sobe contentores - exige Ministack + `make tf-apply` já corridos |
| `make down` | Para os contentores |
| `make logs` | Logs em tempo real |
| `make reset` | Remove volumes e refaz `make setup` |
| `make tf-init` | `terraform init` |
| `make tf-apply` | Provisiona recursos + regenera `rds*.env` |
| `make sync-vite-gateway` | Atualiza `VITE_MS_AUTH_URL` no `.env` a partir do Terraform |
| `make fix-rds` | Regenera `rds*.env` e recria `plus-ms-auth` + `plus-ms-ped` |
| `make rebuild-ms-ped` | Rebuild da imagem após alterar `plus-ms-ped` |
| `make rebuild-mfe-ped` | Rebuild `plus-mfe-ped` + `plus-shell` |
| `make mock-ms4` | Lê eventos `order.*` da fila SQS (mock do MS4 Estoque) |

---

## URLs e portas

| Serviço | URL |
|---------|-----|
| Shell | http://localhost:3000 |
| MS Auth | http://localhost:3001 |
| MFE Auth | http://localhost:4001 |
| MS Pedidos | http://localhost:3007 |
| Swagger (Pedidos) | http://localhost:3007/docs |
| MFE Pedidos | http://localhost:4007 |
| Ministack | http://localhost:4566 |

O Postgres emulado corre em contentores à parte (`ministack-rds-plus-auth-db`, `ministack-rds-plus-ped-db`). Os IPs são escritos em `terraform/rds.env` e `rds-ped.env` após o `terraform apply`.

O ID do API Gateway é gerado pelo Terraform. Para consultar: `awslocal apigateway get-rest-apis` (com Ministack no ar).

### Rotas do API Gateway

| Método | Rota | Destino |
|--------|------|---------|
| POST | `/auth/login`, `/auth/refresh`, `/auth/logout` | plus-ms-auth:3001 |
| GET | `/auth/me` | plus-ms-auth:3001 |
| ANY | `/orders`, `/orders/{proxy+}` | plus-ms-ped:3007 |

---

## Como adicionar um novo microsserviço

1. **Crie o repositório** no mesmo nível dos demais (ex.: `plus-ms-inventory/`).

2. **Adicione o serviço ao `docker-compose.yml`**, dependendo do Ministack:

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

4. **Rotas ou recursos AWS extras** - adicione em `terraform/main.tf` (seguir padrões de S3, RDS, API Gateway).

5. **Recrie a stack:** `make reset` (ou `make tf-apply` + `docker compose up -d --build` se a alteração for pontual).

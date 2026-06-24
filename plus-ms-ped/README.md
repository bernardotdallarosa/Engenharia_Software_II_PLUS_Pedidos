# plus-ms-ped

Microsserviço de **Pedidos e Vendas** (MS7) do projeto **Plus**.

## Contrato da API

O contrato está em [`openapi/openapi.yaml`](./openapi/openapi.yaml) (**v0.2.0**). UI interativa em **`/docs`**; YAML em **`/openapi.yaml`**.

Rotas de domínio (`/orders/*`) implementadas com JWT, RBAC e persistência em PostgreSQL (`plus_ped`).

## Persistência (PostgreSQL)

O serviço liga-se à base **`plus_ped`** no arranque e cria as tabelas `orders` e `order_items` se não existirem (`src/database/schema.ts`).

Variáveis: ver [`.env.example`](./.env.example). Em Docker, o `plus-infra` passa `terraform/rds-ped.env` e `DB_NAME=plus_ped`.

Estrutura em camadas (em construção):

| Pasta | Papel |
|-------|--------|
| `src/config/database.ts` | Pool `pg` |
| `src/database/schema.ts` | DDL e bootstrap |
| `src/repositories/` | Acesso a dados |
| `src/services/` | Regras de negócio |
| `src/routes/` | HTTP / Express |

## Executar localmente

```bash
cd plus-ms-ped
npm install
npm run dev
```

- Swagger UI: http://localhost:3007/docs  
- OpenAPI YAML: http://localhost:3007/openapi.yaml  
- Health: http://localhost:3007/health  

> Porta **3007** evita conflito com `plus-ms-auth` (3001).

## Docker

```bash
docker build -t plus-ms-ped .
docker run --rm -p 3007:3007 -e PORT=3007 plus-ms-ped
```

## CI/CD e publicação

O workflow está na **raiz do monorepo**: [`.github/workflows/ci-plus-ms-ped.yml`](../.github/workflows/ci-plus-ms-ped.yml).  
Em cada pull request / push para `main` e `develop` executa `npm ci`, `npm test` e `npm run build` dentro de `plus-ms-ped/`.

A publicação da imagem Docker ocorre em:

- `workflow_dispatch` manual; ou
- push de tags no formato `v*` (ex.: `v0.2.0`)

Para o release funcionar, o repositório precisa dos seguintes secrets:

- `DOCKERHUB_USERNAME` — nome do utilizador ou organização no Docker Hub
- `DOCKERHUB_TOKEN` — token de acesso com autorização para publicar imagens

Exemplo de imagem publicada:

- `SEU_USUARIO/plus-ms-ped:latest` — em `workflow_dispatch` ou tag `v*`
- `SEU_USUARIO/plus-ms-ped:v0.2.0` — apenas em push de tag `v*`

## Escopo documentado (v0.2.0)

| Recurso | Descrição |
|---------|-----------|
| `POST /orders` | Criar pedido `PURCHASE` ou `SALE` |
| `GET /orders` | Listar com filtros |
| `GET /orders/{orderId}` | Detalhe |
| `POST /orders/{orderId}/reserve` | Reservar grade (`DRAFT` → `RESERVED`) |
| `PATCH /orders/{orderId}/status` | Transição de status |
| `POST /orders/{orderId}/cancel` | Cancelamento |

**Roles:** `admin` / `vendedor` (JWT do `plus-ms-auth`).  
**Fora do escopo:** pagamentos, trocas, devoluções.  
**Estoque:** MS7 publica eventos SQS (`order.*`); junção com MS4 Estoque prevista na arquitetura global.

## Stack completa

Ver [`plus-infra/README.md`](../plus-infra/README.md) — `make setup` sobe auth, shell, pedidos e Ministack.

## Testar a API (curl)

Pré-requisito: stack no ar (`make setup` em `plus-infra`). Utilizador seed: `admindev@admin.com` / `Senha123`.

**1. Obter token**

```bash
curl -s -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admindev@admin.com","password":"Senha123"}'
```

Use o campo `access_token` da resposta.

**2. Criar pedido**

```bash
curl -s -X POST http://localhost:3007/orders \
  -H "Authorization: Bearer SEU_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"type":"SALE","items":[{"productVariantId":"var-vestido-marinho-48","quantity":1}],"notes":"Venda teste"}'
```

Resposta esperada: HTTP **201**, `status` `DRAFT`, `createdBy` = email do token.

**Cenários úteis na avaliação**

| Situação | Resultado |
|----------|-----------|
| Sem `Authorization` | 401 |
| `vendedor` + `type: PURCHASE` | 403 |
| `items` vazio | 400 |
| Imagem Docker desatualizada (sem rebuild) | 501 em `/orders` → `make rebuild-ms-ped` |

Registar vendedor para testes RBAC: `POST http://localhost:3001/auth/register` (ver [`Manual_UI.md`](../plus-mfe-ped/Manual_UI.md)).

## Testes

```bash
npm test
npm run test:coverage   # relatório HTML em coverage/
```

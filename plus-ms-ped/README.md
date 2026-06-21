# plus-ms-ped

Microsserviço de **Pedidos e Vendas** (MS7) do projeto **Plus**.

## Contrato da API

O contrato está em [`openapi/openapi.yaml`](./openapi/openapi.yaml) (**v0.2.0**). UI interativa em **`/docs`**; YAML em **`/openapi.yaml`**.

Rotas de domínio (`/orders/*`) respondem **`501 Not Implemented`** até a implementação completa.

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
**Estoque:** eventos SQS documentados; integração MS4 pendente.

## Stack completa

Ver [`plus-infra/README.md`](../plus-infra/README.md) — `make setup` sobe auth, shell, pedidos e Ministack.

## Testes

```bash
npm test
```

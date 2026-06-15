# Entrega parcial — Swagger MS7 (Pedidos)

## Artefacto principal

Ficheiro: [`plus-ms-ped/openapi/openapi.yaml`](./plus-ms-ped/openapi/openapi.yaml)

## Como demonstrar ao professor

```bash
cd plus-ms-ped
npm install
npm run dev
```

Abrir no browser:

| URL | Conteúdo |
|-----|----------|
| http://localhost:3007/docs | Swagger UI interativo |
| http://localhost:3007/openapi.yaml | Contrato YAML para download/revisão |
| http://localhost:3007/health | Health check (implementado) |

Endpoints `/orders/*` respondem **501** — contrato definido, implementação a seguir.

## Stack local completa (auth + pedidos)

```bash
cd plus-infra
cp .env.example .env   # se ainda não existir
make setup             # Ministack + Terraform + todos os serviços
```

| Serviço | URL |
|---------|-----|
| Shell | http://localhost:3000 |
| MS Auth | http://localhost:3001 |
| MFE Auth | http://localhost:4001 |
| **MS Pedidos** | http://localhost:3007 |
| **MFE Pedidos** | http://localhost:4007 |

## Decisões de modelagem (v0.2.0)

- **Tipos:** `PURCHASE` (entrada) e `SALE` (venda/saída).
- **Status:** `DRAFT` → `RESERVED` → `CONFIRMED` → `COMPLETED`; cancelamento em `CANCELLED`.
- **Roles:** `admin` e `vendedor` (JWT do `plus-ms-auth`). `createdBy` = email (`sub`).
- **Estoque:** eventos `order.reserved`, `order.confirmed`, `order.reservation.released` (SQS; publicador pendente).
- **Pagamento / troca / devolução:** fora do escopo desta versão.

## Repositórios

| Pasta | Papel |
|-------|--------|
| `plus-ms-ped` | Microsserviço + OpenAPI + `/docs` |
| `plus-mfe-ped` | Esqueleto MFE (placeholder exposto ao shell) |
| `plus-shell` | Host — login (`mfe_auth`) + rota Pedidos (`mfe_ped`) |
| `plus-infra` | Compose + Ministack + Terraform (auth + pedidos) |
| `plus-ms-auth` / `plus-mfe-auth` | Auth eleito (imutável para o Grupo 8) |

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
| http://localhost:3001/docs | Swagger UI interativo |
| http://localhost:3001/openapi.yaml | Contrato YAML para download/revisão |
| http://localhost:3001/health | Health check (implementado) |

Endpoints `/orders/*` respondem **501** — contrato definido, implementação a seguir.

## Decisões de modelagem (v0.1.0)

- **Tipos:** `PURCHASE` (entrada) e `SALE` (venda/saída), alinhado ao texto do cliente.
- **Status:** `DRAFT` → `CONFIRMED` → `COMPLETED`; cancelamento em `CANCELLED`.
- **Estoque:** documentado evento assíncrono ao confirmar; sem chamada ao MS4 nesta fase.
- **Pagamento / troca / devolução:** fora do escopo desta versão.

## Repositórios

| Pasta | Papel |
|-------|--------|
| `plus-ms-ped` | Microsserviço + OpenAPI + `/docs` |
| `plus-mfe-ped` | Esqueleto MFE (placeholder) |
| `plus-shell` | Host T1 — não alterado nesta parcial |
| `plus-infra` | Compose só com `plus-ms-ped` e `plus-mfe-ped` |

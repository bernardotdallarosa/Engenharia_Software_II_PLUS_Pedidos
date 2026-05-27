# plus-ms-ped

Microsserviço de **Pedidos e Vendas** (MS7) do projeto **Plus**.

## Entrega parcial (design-first)

O contrato da API está em [`openapi/openapi.yaml`](./openapi/openapi.yaml). A UI interativa é servida em **`/docs`**; o ficheiro bruto em **`/openapi.yaml`**.

Rotas de domínio (`/orders/*`) respondem **`501 Not Implemented`** até a implementação — o foco actual é validar o **Swagger/OpenAPI** com o professor/cliente.

## Executar localmente

```bash
cd plus-ms-ped
npm install
npm run dev
```

- Swagger UI: http://localhost:3001/docs  
- OpenAPI YAML: http://localhost:3001/openapi.yaml  
- Health: http://localhost:3001/health  

## Docker

```bash
docker build -t plus-ms-ped .
docker run --rm -p 3001:3001 plus-ms-ped
```

## Escopo documentado (v0.1.0)

| Recurso | Descrição |
|---------|-----------|
| `POST /orders` | Criar pedido `PURCHASE` (entrada) ou `SALE` (venda) |
| `GET /orders` | Listar com filtros |
| `GET /orders/{orderId}` | Detalhe |
| `PATCH /orders/{orderId}/status` | Transição de status |
| `POST /orders/{orderId}/cancel` | Cancelamento |

**Fora do escopo v0.1.0:** pagamentos, trocas, devoluções. **Estoque:** evento `order.confirmed` documentado; integração com MS4 pendente.

## Autenticação (futuro)

Endpoints protegidos no contrato usam `bearerAuth` (JWT do MS Auth da turma). Middleware de validação será adicionado quando o auth vencedor estiver definido.

## Testes

```bash
npm test
```

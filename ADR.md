# Documento de Decisão de Arquitetura - MS7 Pedidos + MFE7

**Projeto:** Plus - Sistema de Gestão de Estoque para Loja de Roupas Plus Size  
**Disciplina:** Engenharia de Software II - PUCRS 2026-1  
**Domínio:** Grupo 8 - Pedidos e Vendas (`plus-ms-ped` + `plus-mfe-ped`)  
**Versão / Data:** v1.0 - Junho de 2026  
**Status:** Aceito

## 1. CONTEXTO

O domínio Pedidos/Vendas do projeto Plus atua como o ponto de integração entre a experiência do usuário no shell, a autenticação já definida pelo MS Auth eleito e o fluxo operacional de vendas/entradas da loja. O grupo é responsável por gerir o ciclo de vida de pedidos (`PURCHASE` e `SALE`), incluindo reserva de itens, confirmação, conclusão e cancelamento, além de garantir que a interface do usuário tenha visibilidade clara sobre o estado atual do pedido.

No mapeamento global da disciplina, o **MS7** registra pedidos e vendas, dispara baixa de estoque via integração assíncrona e expõe listagem, status e reserva de grade; o **MFE7** oferece criação de pedido/venda, acompanhamento de status e ações de reserva/transição.

O ecossistema global já define uma arquitetura com Shell + MFEs + microsserviços, além de integração assíncrona via SQS. Para o domínio Pedidos, a solução precisa manter compatibilidade com o contrato do MS Auth eleito (`plus-ms-auth`), respeitar o shell como ponto de entrada e permitir evolução independente do serviço de estoque (MS4) sem bloquear o desenvolvimento do MS7.

O contrato HTTP do domínio está documentado em **OpenAPI 3.0** (`plus-ms-ped/openapi/openapi.yaml`, versão v0.2.0).

## 2. DECISÃO ARQUITETURAL

Foi adotada uma arquitetura distribuída composta por:

- **Microsserviço** `plus-ms-ped` para regras de negócio, persistência e integração de eventos;
- **Microfrontend** `plus-mfe-ped` para operações de listagem, criação e acompanhamento de pedidos;
- **Shell** como host principal que recebe o remote do MFE7 e mantém o estado de sessão do utilizador.

A organização interna do microsserviço segue a separação em camadas:

- `routes` → endpoints HTTP e tratamento de respostas;
- `services` → validação de regras de negócio, autorização e transições de status;
- `repositories` → acesso aos dados persistidos no PostgreSQL.

O acesso protegido aos endpoints é feito com **JWT stateless**, utilizando o mesmo segredo compartilhado com o microsserviço de autenticação (`JWT_SECRET`), de forma que o MS Pedidos valida o token localmente sem depender de uma chamada extra ao auth a cada requisição. Em desenvolvimento local, o MFE chama o MS diretamente na porta `3007` com `Authorization: Bearer`. O API Gateway do `plus-infra` também expõe rotas `/orders/*` para alinhar com a arquitetura global da disciplina.

A autorização no domínio é baseada em RBAC com papéis `admin` e `vendedor` (claims do JWT eleito). A matriz abaixo orienta backend e frontend:

| Operação | admin | vendedor |
|----------|:-----:|:--------:|
| Criar SALE | sim | sim |
| Criar PURCHASE | sim | não |
| Listar / consultar | sim | sim |
| Reservar grade | sim | sim |
| Confirmar / completar SALE | sim | sim |
| Confirmar / completar PURCHASE | sim | não |
| Cancelar qualquer pedido elegível | sim | não |
| Cancelar pedido próprio (`createdBy` = email do token) | sim | sim |

A persistência é separada por serviço, com banco dedicado para o domínio Pedidos (`plus_ped`), evitando acoplamento direto com outros domínios.

## 3. MODELO DE DOMÍNIO

O domínio central é o pedido, com os tipos:

- `PURCHASE` - entrada/reposição;
- `SALE` - saída/venda.

O ciclo de vida do pedido segue o fluxo:

- `DRAFT` → `RESERVED` → `CONFIRMED` → `COMPLETED`
- `CANCELLED` como estado terminal alternativo

O campo `createdBy` é preenchido com o email do usuário autenticado (`claim sub` do JWT), permitindo que regras de cancelamento e auditoria sejam verificadas com base no criador do pedido.

A representação do pedido mantém também os itens associados (`order_items`), com referências a variantes de produto (`productVariantId`) e quantidade, mantendo o contrato compatível com a OpenAPI documentada.

## 4. INTEGRAÇÕES

O microsserviço publica eventos assíncronos na fila SQS `plus-order-events` para sinalizar mudanças relevantes do domínio:

- `order.reserved` - quando o pedido entra em `RESERVED`;
- `order.confirmed` - quando o pedido entra em `CONFIRMED`;
- `order.reservation.released` - quando a reserva é liberada por cancelamento.

Esses eventos são projetados para permitir a integração futura com o domínio de estoque (MS4). No momento, o contrato exato do consumidor ainda não está fechado; o MS Pedidos atua apenas como **produtor**. A publicação é *best-effort*: falhas na fila são logadas e não impedem a conclusão da operação HTTP.

## 5. FLUXO

O fluxo básico do domínio é:

1. O usuário acessa o shell na porta `3000` e autentica-se via MFE Auth.
2. O shell armazena o token em `localStorage` (`plus.auth.token`).
3. Ao abrir **Pedidos**, o shell carrega o remote `mfe_ped/OrdersPage`.
4. O MFE7 chama o microsserviço em `http://localhost:3007` com `Authorization: Bearer <token>`.
5. O microsserviço valida o JWT, aplica RBAC, persiste em `plus_ped` e responde conforme OpenAPI.
6. Em transições relevantes, o MS7 publica mensagens na fila SQS `plus-order-events`.

**Nota:** o MFE não deve ser usado isoladamente em `:4007` para operação autenticada - sem sessão do shell, o token não está disponível.

## 6. STACK

### Back-end

- Node.js
- Express
- TypeScript
- PostgreSQL
- Vitest + Supertest
- OpenAPI 3.0 / Swagger UI (`/docs`)

### Front-end

- React
- TypeScript
- MUI
- Vite
- Module Federation

### Infra/local

- Docker
- Docker Compose
- Ministack (SQS, RDS, API Gateway emulados)
- Terraform (`plus-infra/terraform`) para recursos locais

## 7. ALTERNATIVAS CONSIDERADAS

| Alternativa | Prós | Contras / motivo da rejeição |
|-------------|------|------------------------------|
| Baixa de estoque síncrona (HTTP direto no MS4) | Resposta imediata de saldo | Acoplamento temporal; MS4 sem contrato fechado; falhas em cascata |
| Eventos SQS pelo MS Pedidos | Desacoplamento; alinhado ao ADR global da disciplina | Consistência eventual; consumidor ainda pendente - **escolhida** |
| Mesmo banco do MS Auth | Setup mais simples | Viola database-per-service; acoplamento entre domínios |
| Validação JWT só no API Gateway | Menos lógica nos MSs | Em dev local o MFE chama o MS direto; MS valida com `JWT_SECRET` compartilhado - **escolhida para o par MS7/MFE7** |
| Monolito Pedidos+Estoque no Grupo 8 | Menos rede | Não atende divisão por domínio da disciplina; impede trabalho paralelo entre grupos |

## 8. TRADE-OFFS

### Vantagens

- Separação clara entre regras de negócio, acesso a dados e API HTTP.
- Permite evoluir o domínio sem impactar diretamente outros serviços.
- Mantém compatibilidade com a arquitetura do projeto baseada em Shell + MFEs.
- Facilita testes isolados do comportamento do serviço e da API.
- O uso de eventos assíncronos reduz o acoplamento imediato com o MS Estoque.

### Desvantagens / riscos

- A validação local do JWT reduz chamadas extras, mas exige cuidado com a consistência do `JWT_SECRET` entre ambientes.
- A publicação SQS é best-effort (falha na fila não reverte o pedido), o que exige idempotência e reconciliação no consumidor futuro (MS4).
- O frontend depende fortemente do contrato OpenAPI para o formato esperado das respostas e dos erros, tornando mudanças nos contratos sensíveis para a UI.
- A arquitetura distribuída aumenta a complexidade operacional local (containers, variáveis de ambiente, portas e dependências externas).

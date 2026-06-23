# Manual de Uso do MFE7 — Pedidos

## 1. Pré-requisitos

Antes de usar a tela de Pedidos, certifique-se de que o ambiente local está em execução com o `make setup` dentro de `plus-infra`.

O fluxo de uso deve ser feito sempre pelo Shell:

- Endereço do Shell: `http://localhost:3000`
- Não acesse o MFE de Pedidos diretamente em `http://localhost:4007` para uso normal, pois o token de autenticação e o carregamento do Shell são necessários.

Credenciais de teste:

- Email: `admindev@admin.com`
- Senha: `Senha123`

## 2. Como entrar

1. Abra `http://localhost:3000` no navegador.
2. No Shell, faça login com as credenciais de teste.
3. Depois de autenticado, clique no menu **Pedidos**.

A tela de Pedidos tem três colunas:

- **Novo pedido**: formulário para criar um pedido.
- **Lista**: histórico de pedidos recentes e filtros.
- **Detalhe**: informações completas do pedido selecionado.

## 3. Listar e filtrar

A coluna central permite pesquisar pedidos e filtrar o que aparece:

- **Tipo**: filtra por `SALE` ou `PURCHASE`.
- **Status**: filtra por `DRAFT`, `RESERVED`, `CONFIRMED`, `COMPLETED` ou `CANCELLED`.

Para ver os detalhes de um pedido, clique no cartão correspondente na lista. O pedido selecionado é mostrado na coluna de detalhe.

## 4. Criar pedido

Use o formulário da primeira coluna para criar um novo pedido.

Campos disponíveis:

- **Tipo**: escolha entre `SALE` ou `PURCHASE`.
- **Fornecedor / referência**: campo livre para texto.
- **Observações**: comentário adicional sobre o pedido.
- **Itens**: cada linha representa um item do pedido.

Formato dos itens no textarea:

- Cada item deve estar em uma linha separada.
- Use `productVariantId, quantidade`.

Exemplo:

```
var-vestido-marinho-48, 1
var-cinto-preto-unico, 2
```

### Diferença por perfil

- **admin**: pode criar `SALE` e `PURCHASE`.
- **vendedor**: pode criar apenas `SALE`.

## 5. Ações no detalhe

A coluna de detalhe apresenta botões para ações dependentes do status do pedido.

- **Reservar**: disponível quando o pedido está em `DRAFT`.
- **Confirmar**: disponível quando o pedido está em `DRAFT` ou `RESERVED`.
- **Concluir**: disponível quando o pedido está em `CONFIRMED`; para `vendedor`, só para pedidos `SALE`.
- **Cancelar**: disponível quando o pedido não está em `COMPLETED` ou `CANCELLED`. **Vendedor** só pode cancelar pedidos que ele mesmo criou; **admin** pode cancelar qualquer pedido elegível.

O que muda no status:

- `Reservar` → o pedido passa para `RESERVED`.
- `Confirmar` → o pedido passa para `CONFIRMED`.
- `Concluir` → o pedido passa para `COMPLETED`.
- `Cancelar` → o pedido passa para `CANCELLED`.

## 6. Erros comuns

### `Missing bearer token`

Esse erro ocorre quando você não está autenticado no Shell ou tentou usar a interface diretamente em `http://localhost:4007`.

### `403` — perfil sem permissão

Se aparecer `403`, significa que a sua conta não tem permissão para a ação solicitada. Por exemplo:

- `vendedor` não pode criar `PURCHASE`.
- `vendedor` não pode confirmar/concluir pedidos `PURCHASE`.
- `vendedor` não pode cancelar pedido criado por outro usuário.

### Verificar token em DevTools

No navegador, abra DevTools (F12) → **Application** → **Local Storage** → `http://localhost:3000` e confira a chave `plus.auth.token`.

Ou no console:

```js
localStorage.getItem('plus.auth.token')
```

Se o token estiver ausente, faça logout e volte a entrar pelo Shell.

## 7. Referência rápida de status

| Status UI | Status interno | Significado |
|-----------|----------------|-------------|
| Rascunho | `DRAFT` | Pedido criado, ainda não reservado |
| Reservado | `RESERVED` | Grade reservada, aguardando confirmação |
| Confirmado | `CONFIRMED` | Pedido confirmado, pronto para conclusão |
| Concluído | `COMPLETED` | Pedido finalizado |
| Cancelado | `CANCELLED` | Pedido cancelado |

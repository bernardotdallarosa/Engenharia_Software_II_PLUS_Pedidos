# plus-mfe-ped

Microfrontend de **Pedidos** (MFE7). Estrutura mínima para Module Federation com a tela de pedidos já integrada ao shell.

**Manual de uso:** [`Manual_UI.md`](./Manual_UI.md)

## Desenvolvimento

```bash
npm install
npm run dev
```

Standalone: http://localhost:4007  
Remote: http://localhost:4007/assets/remoteEntry.js — expõe `OrdersPage`.

## Build e publicação

O build usa a variável `VITE_MS_PED_URL` para apontar o backend do microsserviço. O valor padrão é:

```bash
http://localhost:3007
```

O workflow de CI executa `npm run type-check` e `npm run build`, além de validar a existência do `remoteEntry.js`.

A publicação do pacote NPM acontece em:

- `workflow_dispatch` manual; ou
- push de tags no formato `v*`

Para o release funcionar, o repositório precisa do secret:

- `NPM_TOKEN` — token com permissão para publicar o pacote

Antes de cada release, incremente `version` em `package.json` (o NPM rejeita republicar a mesma versão).

Exemplo de pacote publicado:

- `@bernardotdallarosa/plus-mfe-ped` (recomendado usar scope no `name` do `package.json` se o nome simples estiver ocupado)

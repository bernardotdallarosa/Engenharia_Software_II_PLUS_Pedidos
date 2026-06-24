# plus-mfe-ped

Microfrontend de **Pedidos** (MFE7). Module Federation com a tela de pedidos integrada ao shell (`mfe_ped` → `OrdersPage`).

**Manual de uso:** [`Manual_UI.md`](./Manual_UI.md) — fluxo sempre pelo shell em http://localhost:3000

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

O workflow está na **raiz do monorepo**: [`.github/workflows/ci-plus-mfe-ped.yml`](../.github/workflows/ci-plus-mfe-ped.yml).  
Executa `npm run type-check` e `npm run build`, além de validar a existência do `remoteEntry.js`.

A publicação do pacote NPM acontece em:

- `workflow_dispatch` manual; ou
- push de tags no formato `v*`

Para o release funcionar, o repositório precisa do secret:

- `NPM_TOKEN` — token com permissão para publicar o pacote

Antes de cada release, incremente `version` em `package.json` (o NPM rejeita republicar a mesma versão).

Pacote publicado:

- [`@bernardotdallarosa/plus-mfe-ped`](https://www.npmjs.com/package/@bernardotdallarosa/plus-mfe-ped) (versão atual em `package.json`)

## Stack completa

Ver [`plus-infra/README.md`](../plus-infra/README.md) — `make setup` sobe auth, shell, pedidos e Ministack.

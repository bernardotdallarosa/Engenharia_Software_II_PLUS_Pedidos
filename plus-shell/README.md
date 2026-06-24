# plus-shell

Host **Plus** com **Module Federation** (`@originjs/vite-plugin-federation`): consome os remotes `mfe_auth` (login) e `mfe_ped` (Pedidos). Sessão em `localStorage` na origem `:3000`; após login, o estado local alterna para o dashboard (sem React Router).

Decisões do domínio Pedidos: [**ADR.md**](../ADR.md) na raiz do monorepo.

**Salvaguardas (integração):**

- **Vite 5** + **@originjs/vite-plugin-federation** alinhados ao `plus-mfe-auth`.
- O MFE emite `plus-auth-login-success` em `window` após login; o shell **também escuta** esse evento, além da prop `onLogin`, porque a prop pode não propagar correctamente pelo remote.
- O build Docker recebe **`MFE_AUTH_URL`** (URL absoluto do `remoteEntry.js`, por omissão `http://localhost:4001/assets/remoteEntry.js`).

---

## Tecnologias

- React 18
- Vite 5 + `@vitejs/plugin-react` v4
- `@originjs/vite-plugin-federation`

---

## Variáveis de ambiente (build)

| Variável | Descrição |
|---|---|
| `MFE_AUTH_URL` | URL absoluto do `remoteEntry.js` do MFE auth (ex.: `http://localhost:4001/assets/remoteEntry.js`). |
| `MFE_PED_URL` | URL absoluto do `remoteEntry.js` do MFE pedidos (ex.: `http://localhost:4007/assets/remoteEntry.js`). |
| `VITE_MS_AUTH_URL` | Base URL do `plus-ms-auth` para o bundle do **remote** auth. |

No Docker, ver `plus-infra/docker-compose.yml` (`MFE_AUTH_URL`, `VITE_MS_AUTH_BROWSER`).

---

## Desenvolvimento local

1. Subir o **plus-mfe-auth** em `http://localhost:4001` (`npm run dev` ou Docker).
2. No shell:

```bash
npm install
npm run dev
```

3. Abrir `http://localhost:3000`.

Se o remote não carregar, ver mensagem do `RemoteErrorBoundary` e confirmar `http://localhost:4001/assets/remoteEntry.js` no browser.

---

## Scripts

| Comando | Descrição |
|---|---|
| `npm run dev` | Dev na porta 3000 |
| `npm run build` | Build com federation |
| `npm run preview` | Preview do `dist` |
| `npm run test` | Vitest (watch) |
| `npm run test:run` | Vitest uma vez (CI) |

---

## Executando com a stack completa

`plus-infra`: o `plus-shell` depende do `plus-mfe-auth` saudável e recebe `MFE_AUTH_URL` no build. Ver [README do plus-infra](../plus-infra/README.md).

Fluxo rápido: `cd ../plus-infra && make setup` → abrir `http://localhost:3000` → login chama o `plus-ms-auth` na base configurada no build do MFE (por omissão no Docker, `http://localhost:3001` via `VITE_MS_AUTH_BROWSER`).

---

## Module Federation (resumo)

| Host | Remote | Expõe |
|------|--------|--------|
| `shell` | `mfe_auth` → `MFE_AUTH_URL` | `LoginPage` lazy |
| `shell` | `mfe_ped` → `MFE_PED_URL` | `OrdersPage` lazy (menu **Pedidos**) |
| Shared | `react`, `react-dom` | - |

Após login, o MFE auth emite `plus-auth-login-success` em `window`; o shell escuta esse evento além da prop `onLogin`.

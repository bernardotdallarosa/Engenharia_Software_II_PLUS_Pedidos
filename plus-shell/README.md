# plus-shell

Host **Plus** com **Module Federation** (`@originjs/vite-plugin-federation`): consome o remote `mfe_auth` e expõe o `LoginPage` do `plus-mfe-auth`. Sessão em `localStorage` na origem `:3000`; após login, o estado local alterna para o dashboard (sem React Router, para evitar os problemas de navegação vistos antes).

Decisões de arquitetura: [**ADR-0001**](../ADR-0001-arquitetura-stack-plus.md).

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
| `MFE_AUTH_URL` | URL absoluto do `remoteEntry.js` do MFE (ex.: `http://localhost:4001/assets/remoteEntry.js`). |
| `VITE_MS_AUTH_URL` | Base URL do `plus-ms-auth` para o bundle do **remote** (o login corre no MFE); em dev local do shell só afecta se re-exportares lógica no host. |

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

| Host | Remote |
|------|--------|
| `shell` | `mfe_auth` → `MFE_AUTH_URL` (ficheiro `remoteEntry.js`) |
| Expõe | `LoginPage` lazy: `import("mfe_auth/LoginPage")` |
| Shared | `react`, `react-dom` |

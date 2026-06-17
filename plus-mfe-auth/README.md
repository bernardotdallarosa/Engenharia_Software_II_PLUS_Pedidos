Trabalho 1 de ES2, Grupo 7

Integrantes: Jasmine Vanzella, Julia Fernandes, Luiza Rosito, Murilo Souza e Rafael Madeira 

# plus-mfe-auth

# README Microfrontend de autenticação - Projeto Plus Gestão

Expõe as páginas de fluxo de autenticação e gerenciamento via **Module Federation** para serem consumidas pelo `plus-shell`. Construído com React, TypeScript, Material UI (MUI) e Vite.

## Tecnologias

- **React 18** + **TypeScript**
- **Vite 5**
- **Material UI (MUI)** — Design System e Componentização
- `@originjs/vite-plugin-federation` — Module Federation
- `@vitejs/plugin-react`

## Module Federation

Este microfrontend atua como **remote** e expõe múltiplos módulos para o Host (Shell):

| Propriedade | Valor |
|---|---|
| Nome | `mfe_auth` |
| Entry point | `http://localhost:4001/assets/remoteEntry.js` |
| Expõe (`./LoginPage`) | `src/pages/LoginPage.tsx` |
| Expõe (`./RegisterPage`) | `src/pages/RegisterPage.tsx` |
| Expõe (`./SuccessPage`) | `src/pages/SuccessPage.tsx` |
| Expõe (`./DashboardPage`) | `src/pages/DashboardPage.tsx` |
| Shared | `react`, `react-dom` |

## Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (ou utilize a injeção via Docker/Vite).

| Variável | Descrição | Valor Padrão |
|---|---|---|
| `VITE_MS_AUTH_URL` | URL do microsserviço de autenticação (`plus-ms-auth`) | `http://localhost:3001` |

## Scripts

Os comandos abaixo são gerenciados via NPM e executados utilizando o Vite:

| Comando | Descrição |
|---|---|
| `npm run dev` | Inicia em modo desenvolvimento na porta 4001 |
| `npm run build` | Gera o bundle de produção na pasta `dist/` |
| `npm run preview` | Serve o build gerado simulando o ambiente de produção na porta 4001 |

## Desenvolvimento Local (sem Docker)

Como todas as dependências (incluindo o Material UI e o Vite Federation) já estão mapeadas no `package.json`, a instalação é simples:

```bash
# Instala todas as dependências do projeto
npm install

# Inicia o servidor de desenvolvimento
npm run dev
```

# LOGS DE IA LOCALIZADOS NA PASTA plus-ms-auth/ai_logs
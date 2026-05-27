# ADR-0001 — Arquitetura da stack Plus (auth, MFE, shell, infra local)

| Campo | Valor |
|--------|--------|
| **Estado** | Aceite |
| **Data** | 2026-05-10 |
| **Contexto** | Trabalho T1 — autenticação/autorização, microfrontend React+TS+MUI, microsserviço de auth, infraestrutura local com Ministack (LocalStack) e Terraform |

---

## 1. Contexto e problema de negócio

O sistema **Plus** é um gestor de stock de roupa. A primeira fatia entregue concentra-se em **identidade**: login, tokens, perfil do utilizador e base para autorização por papéis. A solução tem que:

- Ser demonstrável **localmente** com Docker Compose.
- Refletir uma arquitetura de **microsserviço** + **API Gateway** (padrão cloud).
- Expor a autenticação também como **microfrontend** consumível por um **shell** (host).
- Manter **documentação** (Swagger no MS, manual de UI no MFE) e **CI** (build + testes) por repositório.

Este ADR regista **decisões**, **justificativas**, **trade-offs** e **incidentes** resolvidos durante a implementação, com base no código e na conversa de implementação do projeto.

---

## 2. Visão geral da arquitectura

### 2.1 Repositórios e layout

O trabalho assume **quatro repositórios irmãos** no mesmo diretório (monorepo de pastas, sem npm workspaces obrigatório na raiz):

| Pasta | Papel |
|--------|--------|
| `plus-infra` | Orquestração: `docker-compose.yml`, `Makefile`, Terraform (`terraform/`), `.env` partilhado, geração de `terraform/rds.env`. |
| `plus-ms-auth` | API REST de autenticação (Node + TypeScript + Express), JWT, PostgreSQL, Swagger. |
| `plus-mfe-auth` | Remote Module Federation: expõe `LoginPage` (React + TS + MUI + Vite). |
| `plus-shell` | Host Module Federation: carrega o remote `mfe_auth`, gere sessão na origem `:3000`. |

A raiz do monorepo pode conter apenas `package.json` / `CHECKLIST.md` / este ADR; os serviços vivem nas subpastas.

### 2.2 Fluxo de dados (alto nível)

```text
Browser (:3000 shell)
  → carrega remoteEntry.js do MFE (:4001)
  → executa LoginPage (bundle do remote; React partilhado com o host)
  → fetch POST /auth/login para BASE_URL (VITE_MS_AUTH_URL no build)
  → plus-ms-auth (:3001) valida credenciais na PostgreSQL (RDS emulado)
  ← JWT access + refresh
  → localStorage (tokens) + CustomEvent + callback onLogin → shell mostra dashboard
```

Em **paralelo**, o Terraform provisiona **API Gateway** no Ministack apontando para `http://plus-ms-auth:3001/...`, permitindo chamadas **server-side** ou **curl** pelo URL do Gateway. O caminho **browser → Gateway** em local apresentou fragilidade de **CORS** (seção 8).

### 2.3 Portas e URLs locais (padrão)

| Serviço | Porta / URL |
|---------|-------------|
| `plus-shell` | `http://localhost:3000` |
| `plus-ms-auth` | `http://localhost:3001` |
| `plus-mfe-auth` | `http://localhost:4001` (`remoteEntry.js` em `/assets/remoteEntry.js`) |
| Ministack | `http://localhost:4566` |
| API Gateway | `http://localhost:4566/restapis/<id>/v1/_user_request_` (prefixo exato depende do output Terraform) |

Variáveis relevantes:

- **`VITE_MS_AUTH_URL`**: injetada no **build** do Vite (MFE e, quando usada, shell); base do `fetch` para `/auth/*`.
- **`VITE_MS_AUTH_BROWSER`**: usada no `docker-compose` do `plus-infra` como **override** do URL servido ao browser no build (por omissão `http://localhost:3001`) — ver seção 8.
- **`MFE_AUTH_URL`**: URL absoluto do ficheiro `remoteEntry.js` no **build** do shell (por omissão `http://localhost:4001/assets/remoteEntry.js`).
- **`JWT_SECRET`**, credenciais **`DB_*`**, **`AWS_*`**, **`AWS_ENDPOINT`**: MS e, onde aplicável, MFE/shell para futuras integrações AWS SDK.

---

## 3. Decisão: Node.js no microsserviço de autenticação

### 3.1 Escolha

O `plus-ms-auth` corre em **Node.js 20** com **TypeScript**, servidor **Express 4**, runtime após compilação para `dist/`.

### 3.2 Justificativa

- **Ecossistema maduro** para APIs HTTP, middlewares, CORS e integração com `pg`, `jsonwebtoken`, `swagger-ui-express`.
- **Alinhamento** com o frontend (JavaScript/TypeScript), reduzindo atrito na modelagem de DTOs e erros JSON.
- **Docker** oficial Node multi-stage é padrão de indústria para compilar TS e correr `node dist/server.js`.

### 3.3 Trade-offs

| Prós | Contras |
|------|---------|
| Produtividade, bibliotecas, DX | Single-threaded; picos CPU-bound precisam de dimensionamento horizontal |
| Boa integração com JSON/JWT | Comparado a JVM/Go, menor disciplina de tipos sem TS (mitigado com TS estrito no MS) |

**Alternativas consideradas:** Go ou Java/Spring para auth — rejeitadas para este âmbito por custo de curva e foco em entregar MFE + infra no mesmo stack técnico pedido.

---

## 4. Decisão: TypeScript no MS e nos frontends

### 4.1 Escolha

TypeScript **5** no `plus-ms-auth`, `plus-mfe-auth` e tipagem implícita via JSDoc/JS no `plus-shell` (host em `.jsx` + Vite).

### 4.2 Justificativa

- Contratos explícitos para **request/response** de auth (`LoginResponse`, `User`, etc.).
- Refactor seguro em rotas Express e componentes React.
- **OpenAPI** gerado a partir de anotações em `src/routes/*.ts` mantém coerência com o código.

### 4.3 Trade-offs

| Prós | Contras |
|------|---------|
| Menos erros em tempo de execução | Passo de build (`tsc`) no MS; config `tsconfig` a manter |

---

## 5. Decisão: Express, PostgreSQL e JWT

### 5.1 Modelo de autenticação

- **Access token** JWT (~**15 minutos**), payload com `sub`, `email`, `role`.
- **Refresh token** JWT (~**7 dias**), usado em `POST /auth/refresh` para emitir novo access sem reenviar password.
- **bcryptjs** para hash de passwords na tabela `users`.
- **Stateless** no servidor: não há store de sessão em memória; revogação fina não está modelada (logout limpa do lado cliente e invalidação global exigiria lista de bloqueio — fora de âmbito).

### 5.2 Justificativa de JWT

- Encaixa no requisito de **microsserviços** e gateways: o consumidor valida assinatura com segredo compartilhado (`JWT_SECRET`).
- Simples de testar com `curl` e de documentar no Swagger (`bearerAuth`).

### 5.3 Trade-offs JWT

| Prós | Contras |
|------|---------|
| Escalabilidade horizontal sem sticky sessions | Revogação imediata de access token é limitada sem allowlist/denylist |
| Stateless | Segredo comprometido invalida todas as sessões |

### 5.4 PostgreSQL (RDS emulado)

- Persistência realista; `init-db` cria schema e **utilizadores de demo** (emails `admin@`, `staff@`, `manager@`) de forma **idempotente**.
- O `docker-compose` do `plus-infra` injeta `terraform/rds.env` no contentor do MS com `DB_HOST` tipicamente um IP da rede Docker (não o hostname `ministack`), gerado após `terraform apply`.

### 5.5 CORS no MS

Origens permitidas incluem `http://localhost:3000` e `http://localhost:4001` (e variantes `127.0.0.1`), alinhadas ao shell e ao MFE standalone.

---

## 6. Decisão: RBAC com roles em string

### 6.1 Escolha

Roles: **`ADMIN`**, **`STAFF`**, **`MANAGER`**. A `role` é persistida em coluna na tabela `users` e copiada para o access JWT. Middleware **`requireRole`** protege rotas de exemplo (ex.: `GET /auth/admin/ping` só para `ADMIN`).

### 6.2 Justificativa

- Cumpre o checklist sem normalizar para tabelas `roles` / `user_roles` (pode evoluir).
- JWT auto-contido facilita o shell/MFE a saber o papel para UI futura.

### 6.3 Trade-offs

| Prós | Contras |
|------|---------|
| Implementação rápida | Alteração de papel exige novo token (refresh/login) |

---

## 7. Decisão: Terraform + Ministack + API Gateway

### 7.1 Escolha

- **Ministack** (imagem `ministackorg/ministack`) emula **S3, RDS, API Gateway, STS** na porta **4566**.
- **Terraform** declara recursos; **`make setup`** / **`make tf-apply`** correm no **host** (não dentro de um serviço `terraform` no Compose), para evitar **corrupção / duplicação de state** quando o mesmo `terraform/` seria montado em Windows vs Linux container (comentário explícito no `docker-compose.yml`).

### 7.2 API Gateway

- Rotas `/auth/login`, `/auth/refresh`, `/auth/logout`, `/auth/me` proxy para `http://plus-ms-auth:3001/...` dentro da rede Docker.
- O **`gateway_url`** é escrito no `.env` como **`VITE_MS_AUTH_URL`** para referência e testes.

### 7.3 Justificativa

- Demonstra **infra-as-code** e padrão **BFF/API** em ambientes AWS.
- Mantém o MS desacoplado do URL externo: o Gateway pode mudar sem alterar regras de negócio.

### 7.4 Trade-offs

| Prós | Contras |
|------|---------|
| Paridade com cloud | LocalStack/Ministack: diferenças de CORS, latência e bugs em relação à AWS real |

---

## 8. Decisão crítica: browser direto ao MS vs API Gateway (local)

### 8.1 Problema observado

Com o browser em `http://localhost:3000` ou `http://localhost:4001`, chamadas `fetch` ao API Gateway em **`http://localhost:4566/...`** falharam com **CORS** ou **Failed to fetch**, apesar do microsserviço responder corretamente quando chamado diretamente.

### 8.2 Decisão pragmática

- Manter **`VITE_MS_AUTH_URL`** no `.env` com o URL do Gateway (Terraform) — **referência arquitetural** e útil para **`curl`**, Postman, ou clientes sem política CORS de browser.
- No **build Docker** do MFE e do shell, passar por omissão **`VITE_MS_AUTH_BROWSER=http://localhost:3001`** para que o bundle use o **MS directo**, onde o **CORS** está controlado.

### 8.3 Consequência

- O requisito “comunicação via Gateway no browser” fica **documentado como limitação local**; a **arquitetura** mantém o Gateway; a **experiência** local prioriza estabilidade.
- Mitigações futuras: **proxy reverso** na mesma origem que o shell, CORS customizado no emulador, ou API Gateway real na AWS.

Este ponto está espelhado no **`CHECKLIST.md`** (nota ao item 20) e nos READMEs do `plus-infra` e `plus-mfe-auth`.

---

## 9. Decisão: Material UI (MUI) no microfrontend

### 9.1 Escolha

**Material UI v5** (`@mui/material`) com **Emotion** no `plus-mfe-auth`.

### 9.2 Justificativa

- Cumpre o requisito explícito de **MUI**.
- Componentes acessíveis (`TextField`, `Alert`, foco, `helperText`).

### 9.3 Module Federation e MUI

- **`shared`** no Vite Federation inclui apenas **`react`** e **`react-dom`** (array de strings no `@originjs/vite-plugin-federation`).
- **`@mui/material` não está em `shared`** — o **remote leva MUI no seu bundle**. O **shell não inclui MUI** (só React).
- Em **standalone**, `main.tsx` envolve com **`ThemeProvider`** + **`CssBaseline`**. Quando o `LoginPage` é carregado no shell, **não** passa por esse `ThemeProvider`; o MUI usa **tema por defeito** do pacote no bundle do remote (comportamento aceite para o protótipo).

### 9.4 Trade-offs

| Prós | Contras |
|------|---------|
| UI consistente no MFE | Sem design system partilhado com o shell enquanto o host não usar MUI |
| Partilha só React evita duplicação pesada de runtime MUI | Bundle do remote maior |

---

## 10. Decisão: Vite 5 + `@originjs/vite-plugin-federation`

### 10.1 Escolha

- **Vite 5** no MFE e no shell, com **`@originjs/vite-plugin-federation`**.
- Remote **`mfe_auth`**, ficheiro **`remoteEntry.js`**, expõe **`./LoginPage`**.
- **`build.target: "esnext"`** e **`minify: false`** no MFE (e padrão semelhante no shell) para **reduzir falhas** de resolução de módulos com Federation.

### 10.2 Justificativa

- **`@module-federation/vite`** ou stacks desalinhadas geraram **incompatibilidade** (shell ficava em “Carregando…” / remote não resolvido).
- **Vite 8 + Rolldown** falhou o build com o plugin Federation + MUI no experimento do projeto.

### 10.3 Trade-offs

| Prós | Contras |
|------|---------|
| Interop host/remote estável | Versão do Vite “travada” abaixo da última major |
| `remoteEntry.js` servido em **`/assets/`** (padrão Vite build) | Healthchecks e docs têm que referenciar o path correto |

### 10.4 Integração shell ↔ remote

- **`React.lazy(() => import("mfe_auth/LoginPage"))`** + **`Suspense`**.
- **`RemoteErrorBoundary`** (class component) captura falhas de load/execução do remote e mostra mensagem com **`MFE_AUTH_URL`** e URL do `remoteEntry.js`.
- **`plus-shell` sem React Router** na versão atual: o estado **`authed`** com **`useState`** alterna entre login e **dashboard** simples (evita problemas de **`useNavigate`** após async e duplicação de rotas).
- **Sincronização de sessão:** o MFE, após `login()` bem-sucedido, faz **`window.dispatchEvent(new CustomEvent("plus-auth-login-success", { detail: data }))`**. O shell **escuta** o mesmo evento (constante partilhada por convenção entre `shellAuthEvents.ts` / `shellAuthEvents.js`) **além** da prop **`onLogin`**, porque **props através do boundary do remote nem sempre propagam** de forma fiável no Federation.
- **`authClient.login`** persiste tokens com **`tokenStorage`** (`plus.auth.token` / `plus.auth.refresh`); o shell usa as **mesmas chaves** ao processar o evento/callback.

---

## 11. Decisão: Nginx no MFE (Docker)

### 11.1 Escolha

Imagem final serve ficheiros estáticos com **Nginx Alpine**.

### 11.2 Detalhes importantes

- **CORS aberto** (ou permissivo) para o browser do shell poder obter **`remoteEntry.js`** de outra origem.
- **Cache desativado** (ou enfraquecido) para **`remoteEntry.js`** durante desenvolvimento iterativo para evitar shell a carregar entrada antiga.
- **Healthcheck** do Compose: `wget` a **`http://127.0.0.1:4001/assets/remoteEntry.js`** — alinhado ao path real do build Vite.
- **Regra aprendida:** **`add_header` dentro de `if` no `server`** do Nginx causou falha de arranque nalgumas iterações; a configuração final evita anti-padrões documentados da comunidade Nginx.

---

## 12. Decisão: Swagger / OpenAPI

### 12.1 Escolha

- **`swagger-jsdoc`** lê anotações OpenAPI 3 em **`src/routes/*.ts`** (e espelho em **`dist/routes/*.js`** após build).
- **`swagger-ui-express`** em **`/docs`**; **`GET /`** redireciona para **`/docs`**.
- Montagem com **spread** de `swaggerUi.serve` (array de middlewares) — necessário para o Express encaminhar corretamente.

### 12.2 Justificativa

- Documentação sempre próxima do código (`@openapi` nos handlers).
- Testável manualmente no browser durante demos.

---

## 13. Decisão: testes e CI

### 13.1 MS (`plus-ms-auth`)

- **Vitest** com mocks de BD e bcrypt; cobre login, refresh, logout, `/me`, RBAC.
- **GitHub Actions**: install, test, build Docker (conforme `.github/workflows`).

### 13.2 MFE (`plus-mfe-auth`)

- **Vitest** + **Testing Library**; testes em **`src/pages/__testes__/LoginPage.test.tsx`** (nome da pasta reflete o repo atual).
- CI: type-check, testes, build Vite, build imagem.

### 13.3 Shell (`plus-shell`)

- **Vitest** + **jsdom** para smoke mínimo.
- CI inclui verificação relacionada com **`remoteEntry`** (path `/assets/remoteEntry.js`).

---

## 14. Docker Compose: dependências e saúde

- **`ministack`** com **healthcheck** HTTP ao endpoint de health do LocalStack.
- **`plus-ms-auth`** depende do ministack saudável; recebe **`terraform/rds.env`**.
- **`plus-mfe-auth`** depende do ministack; healthcheck no **`remoteEntry.js`**.
- **`plus-shell`** depende do ministack **e** do **`plus-mfe-auth` saudável**, garantindo que o remote está servido antes do host subir.
- **`make setup`**: `terraform init`, sobe stack, `terraform apply`, sincroniza **`VITE_MS_AUTH_URL`**, **rebuild** MFE + shell com args de build, `docker compose up -d`.

---

## 15. Riscos e limitações aceites

1. **JWT em `localStorage`** — vulnerável a XSS; mitigação futura: cookies `httpOnly` + CSRF, CSP estrita.
2. **Segredo único** `JWT_SECRET` — rotação e gestão de segredos em produção via vault/SSM.
3. **Gateway vs browser (local)** — já descrito; não reflete limitação da AWS real.
4. **Federation** — versões de React têm de permanecer alinhadas entre host e remote.
5. **Credenciais de demo** em README — apenas para ambiente local.

---

## 16. Alternativas explicitamente rejeitadas (histórico)

| Alternativa | Motivo da rejeição |
|--------------|---------------------|
| `@module-federation/vite` (incompatível com `@originjs` remote) | Remote não carregava no host; unificação no `@originjs`. |
| Vite 8 + Rolldown | Build Federation + MUI falhou. |
| React Router no shell com `navigate` pós-login async | Problemas de fluxo e imports; simplificado para estado local. |
| Terraform dentro do Docker Compose | Partilha de `.terraform` entre OS/container causava applies duplicados / exit 1. |
| Browser → apenas Gateway (local) | CORS / *Failed to fetch*; mantido Gateway na infra, MS no browser. |

---

## 17. Referências internas

- **`plus-infra/README.md`** — comandos `make`, portas, fluxo `setup`.
- **`plus-ms-auth/README.md`** — endpoints, Swagger, curl Windows, Gateway.
- **`plus-mfe-auth/README.md`** — variáveis, Federation, Docker.
- **`plus-mfe-auth/docs/UI_MANUAL.md`** — UX do login.
- **`plus-shell/README.md`** — desenvolvimento local com remote.

---

## 18. Conclusão

A stack adota **Node.js + TypeScript + Express + PostgreSQL + JWT** para auth, **Terraform + Ministack** para infra local incluindo **API Gateway**, **React + TypeScript + Vite 5 + MUI** para o MFE, e **Module Federation (@originjs)** entre **shell** e **remote**, com um desvio **documentado** no tráfego browser→auth em ambiente local (**MS directo** com CORS explícito) para preservar UX estável sem negar o papel do Gateway na arquitetura alvo.

---

## Apêndice A — `LISTEN_HOST` e Docker no Windows

O servidor Express usa `LISTEN_HOST` (por omissão **`0.0.0.0`**) em `src/server.ts`. Escutar só em IPv6 ou interface errada no contentor causou, em alguns cenários Windows, **`ERR_EMPTY_RESPONSE`** ao aceder via `localhost`; `0.0.0.0` força escuta em todas as interfaces IPv4 do contentor.

---

## Apêndice B — Arranque do contentor `plus-ms-auth`

O `Dockerfile` de produção executa **`node dist/scripts/init-db.js && node dist/server.js`**: primeiro migração/seed idempotente, depois API. Garante tabela `users` e utilizadores de demo antes do primeiro `POST /auth/login`.

---

## Apêndice C — Testes manuais e exemplos

- Ficheiro **`examples/login.json`** (referenciado no README) para `curl.exe` com `--data-binary` no Windows evitando erros de JSON no PowerShell.
- Após alterar código do MS, o README indica **`docker compose build plus-ms-auth --no-cache`** no `plus-infra` para forçar imagem nova.

---

## Apêndice D — Raiz do monorepo

Além dos quatro repositórios, a pasta pode conter `CHECKLIST.md`, `package.json` / `package-lock.json` (se existirem) e este **ADR**. Os clones Git independentes por repositório devem colocar o ADR numa localização acordada pela equipa (ex.: wiki ou repo `plus-docs`); neste monorepo de pastas o ADR vive na **raiz comum**.

# Plus — Grupo 8 (Pedidos / Vendas)

Monorepo do **Grupo 8** — disciplina Engenharia de Software II (PUCRS). Domínio **MS7** (`plus-ms-ped`) e **MFE7** (`plus-mfe-ped`), integrados ao Shell e ao auth eleito da turma.

## Estrutura

| Pasta | Papel |
|-------|--------|
| [`plus-ms-ped`](./plus-ms-ped/) | Microsserviço de pedidos (API REST, OpenAPI, PostgreSQL, SQS) |
| [`plus-mfe-ped`](./plus-mfe-ped/) | Microfrontend de pedidos (Module Federation) |
| [`plus-infra`](./plus-infra/) | Docker Compose, Ministack, Terraform |
| [`plus-shell`](./plus-shell/) | Host do frontend (login + menu Pedidos) |
| `plus-ms-auth` / `plus-mfe-auth` | Auth eleito (imutável para o Grupo 8) |

## Início rápido

```bash
cd plus-infra
make setup
```

http://localhost:3000 → login → **Pedidos**. Swagger: http://localhost:3007/docs

Detalhes e troubleshooting: [`plus-infra/README.md`](./plus-infra/README.md).

## Documentação

| Documento | Conteúdo |
|-----------|----------|
| [`ADR.md`](./ADR.md) | Decisões de arquitetura |
| [`plus-mfe-ped/Manual_UI.md`](./plus-mfe-ped/Manual_UI.md) | Manual da tela de Pedidos |
| [`plus-ms-ped/README.md`](./plus-ms-ped/README.md) | API, curl e testes |

## CI/CD

Workflows em [`.github/workflows/`](./.github/workflows/). Push em `main`/`develop` valida e faz build; release (Docker Hub / npm) com tag `v*` ou disparo manual.

Publicações v0.2.0: Docker `plus-ms-ped`, npm [`@bernardotdallarosa/plus-mfe-ped`](https://www.npmjs.com/package/@bernardotdallarosa/plus-mfe-ped).

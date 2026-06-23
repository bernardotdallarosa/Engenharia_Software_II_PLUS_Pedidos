#!/usr/bin/env sh
# Garante plus-infra/.env e gera JWT_SECRET se ainda for placeholder.

set -eu

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ROOT}/.env"
EXAMPLE_FILE="${ROOT}/.env.example"

if [ ! -f "$ENV_FILE" ]; then
  if [ ! -f "$EXAMPLE_FILE" ]; then
    echo "[ensure-env] ERRO: .env.example não encontrado." >&2
    exit 1
  fi
  cp "$EXAMPLE_FILE" "$ENV_FILE"
  echo "[ensure-env] Criado .env a partir de .env.example."
fi

is_placeholder() {
  case "$1" in
    "" | change-me | change-me-in-production | dev-secret) return 0 ;;
    *) return 1 ;;
  esac
}

current="$(grep -E '^[[:space:]]*JWT_SECRET[[:space:]]*=' "$ENV_FILE" 2>/dev/null | tail -n 1 | cut -d= -f2- | tr -d ' "'\''')"

if [ -z "$current" ] || is_placeholder "$current" || [ "${#current}" -lt 16 ]; then
  if command -v openssl >/dev/null 2>&1; then
    secret="$(openssl rand -base64 32 | tr -d '\n')"
  else
    secret="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
  fi

  if grep -qE '^[[:space:]]*JWT_SECRET[[:space:]]*=' "$ENV_FILE"; then
    tmp="$(mktemp)"
    sed "s|^[[:space:]]*JWT_SECRET[[:space:]]*=.*|JWT_SECRET=${secret}|" "$ENV_FILE" > "$tmp"
    mv "$tmp" "$ENV_FILE"
  else
    printf '\nJWT_SECRET=%s\n' "$secret" >> "$ENV_FILE"
  fi

  echo "[ensure-env] JWT_SECRET gerado automaticamente (não commite o .env)."
else
  echo "[ensure-env] JWT_SECRET já definido em .env."
fi

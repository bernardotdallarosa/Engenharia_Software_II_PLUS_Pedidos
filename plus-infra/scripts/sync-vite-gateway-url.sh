#!/usr/bin/env sh
# Atualiza VITE_MS_AUTH_URL no .env com o output do Terraform.
set -e
ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [ ! -f .env ]; then
  echo "[make] ERRO: .env não encontrado em plus-infra." >&2
  exit 1
fi

URL=$(terraform -chdir=terraform output -raw gateway_url 2>/dev/null || true)
if [ -z "$URL" ]; then
  echo "[make] Aviso: terraform output gateway_url vazio — mantenha VITE_MS_AUTH_URL no .env manualmente se precisar do MFE via Gateway."
  exit 0
fi

tmp=$(mktemp)
trap 'rm -f "$tmp"' EXIT
if grep -q '^VITE_MS_AUTH_URL=' .env 2>/dev/null; then
  sed "s|^VITE_MS_AUTH_URL=.*|VITE_MS_AUTH_URL=$URL|" .env > "$tmp"
else
  cat .env > "$tmp"
  printf '\nVITE_MS_AUTH_URL=%s\n' "$URL" >> "$tmp"
fi
mv "$tmp" .env
echo "[make] VITE_MS_AUTH_URL sincronizado com o API Gateway (Terraform)."

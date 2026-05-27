#!/usr/bin/env sh
# Ver comentário em tf-import-existing-s3-rds.ps1
ROOT="$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Garantir endpoint do provider (igual ao .env, se existir)
if [ -f .env ]; then
  set -a
  # shellcheck disable=SC1091
  . ./.env
  set +a
fi
export TF_VAR_endpoint="${AWS_ENDPOINT:-http://localhost:4566}"

state_has() {
  terraform -chdir=terraform state list 2>/dev/null | grep -Fx "$1" >/dev/null 2>&1
}

import_if_absent() {
  addr="$1"
  id="$2"
  if state_has "$addr"; then
    return 0
  fi
  echo "[make] Estado sem '$addr'; a importar recurso existente do Ministack ($id)..."
  terraform -chdir=terraform import -input=false "$addr" "$id" || true
}

import_if_absent aws_s3_bucket.media plus-media
import_if_absent aws_s3_bucket_versioning.media plus-media
import_if_absent aws_db_instance.auth plus-auth-db

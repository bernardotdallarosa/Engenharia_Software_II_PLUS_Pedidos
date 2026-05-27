#!/bin/sh
# Escreve terraform/rds.env com DB_HOST/DB_PORT devolvidos pelo LocalStack após o apply.
# Uso: a partir da raiz do plus-infra: `sh scripts/write-rds-env.sh`
set -eu

if [ -n "${TERRAFORM_DIR:-}" ]; then
  TF_DIR="$TERRAFORM_DIR"
else
  TF_DIR="$(CDPATH= cd -- "$(dirname "$0")/../terraform" && pwd)"
fi

cd "$TF_DIR"
ADDR="$(terraform output -raw rds_address)"
PORT="$(terraform output -raw rds_port)"
printf "DB_HOST=%s\nDB_PORT=%s\n" "$ADDR" "$PORT" > rds.env
echo "[write-rds-env] wrote ${TF_DIR}/rds.env"
cat rds.env

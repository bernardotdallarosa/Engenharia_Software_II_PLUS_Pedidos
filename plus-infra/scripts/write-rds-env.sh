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
AUTH_ADDR="$(terraform output -raw rds_address)"
AUTH_PORT="$(terraform output -raw rds_port)"
PED_ADDR="$(terraform output -raw rds_ped_address)"
PED_PORT="$(terraform output -raw rds_ped_port)"

printf "DB_HOST=%s\nDB_PORT=%s\n" "$AUTH_ADDR" "$AUTH_PORT" > rds.env
printf "DB_HOST=%s\nDB_PORT=%s\n" "$PED_ADDR" "$PED_PORT" > rds-ped.env

echo "[write-rds-env] wrote ${TF_DIR}/rds.env (auth)"
cat rds.env
echo "[write-rds-env] wrote ${TF_DIR}/rds-ped.env (pedidos)"
cat rds-ped.env

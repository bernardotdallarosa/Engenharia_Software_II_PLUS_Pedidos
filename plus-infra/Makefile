.PHONY: setup up down logs reset tf-init tf-apply sync-vite-gateway rebuild-ms-ped rebuild-mfe-ped ensure-env mock-ms4 fix-rds

COMPOSE       = docker compose
MINISTACK_URL = http://localhost:4566/_localstack/health
TF_DIR        = terraform

ifeq ($(OS),Windows_NT)
# No Windows o GNU Make usa cmd.exe; receitas em shell POSIX falham. PowerShell cobre aguardar Ministack e tf-apply.
wait-ministack:
	@powershell -NoProfile -ExecutionPolicy Bypass -Command "$$env:MINISTACK_URL='$(MINISTACK_URL)'; & .\scripts\wait-ministack.ps1"

tf-apply:
	@powershell -NoProfile -ExecutionPolicy Bypass -File scripts/tf-apply-from-env.ps1

sync-vite-gateway:
	@powershell -NoProfile -ExecutionPolicy Bypass -File scripts/sync-vite-gateway-url.ps1

ensure-env:
	@powershell -NoProfile -ExecutionPolicy Bypass -File scripts/ensure-env.ps1

.env: ensure-env

else

# ─── POSIX (Linux, macOS, Git Bash) ───────────────────────────────────────────

wait-ministack:
	@echo "[make] Aguardando Ministack ficar disponível..."
	@for i in $$(seq 1 30); do \
		STATUS=$$(curl -sf $(MINISTACK_URL) | python3 -c "import sys,json; d=json.load(sys.stdin); svcs=d.get('services',{}); print('running' if svcs else 'not-ready')" 2>/dev/null || echo "not-ready"); \
		echo "[make]   status: $$STATUS (tentativa $$i/30)"; \
		if [ "$$STATUS" = "running" ]; then echo "[make] Ministack pronto."; break; fi; \
		if [ "$$i" = "30" ]; then echo "[make] ERRO: Ministack não ficou disponível a tempo." && exit 1; fi; \
		sleep 5; \
	done

tf-apply:
	@echo "[make] Sincronizando estado com S3/RDS já existentes no Ministack (se aplicável)..."
	@sh scripts/tf-import-existing-s3-rds.sh
	@echo "[make] Provisionando recursos via Terraform..."
	TF_VAR_db_name=$${DB_NAME:-plus_auth} \
	TF_VAR_db_user=$${DB_USER:-plus} \
	TF_VAR_db_password=$${DB_PASSWORD:-plus_secret} \
	TF_VAR_ms_auth_port=$${MS_AUTH_PORT:-3001} \
	TF_VAR_ms_ped_port=$${MS_PED_PORT:-3007} \
	TF_VAR_endpoint=$${AWS_ENDPOINT:-http://localhost:4566} \
	terraform -chdir=$(TF_DIR) apply -auto-approve
	@sh scripts/write-rds-env.sh

sync-vite-gateway:
	@sh scripts/sync-vite-gateway-url.sh

ensure-env:
	@sh scripts/ensure-env.sh

.env: ensure-env

endif

# Simula consumidor MS4 (le eventos order.* da fila SQS local)
mock-ms4:
ifeq ($(OS),Windows_NT)
	@powershell -NoProfile -ExecutionPolicy Bypass -File scripts/mock-ms4-consumer.ps1
else
	@docker exec ministack awslocal sqs receive-message \
		--queue-url "http://localhost:4566/000000000000/plus-order-events" \
		--max-number-of-messages 5 --wait-time-seconds 2 --output json \
		| python3 -c "import sys,json; d=json.load(sys.stdin); \
msgs=d.get('Messages') or []; \
print('[MS4 mock] Fila: plus-order-events'); \
print('[MS4 mock] Mensagens:', len(msgs)); \
[print(m.get('Body','')) for m in msgs]"
endif

# Inicializa os providers do Terraform
tf-init:
	@echo "[make] Inicializando Terraform..."
	terraform -chdir=$(TF_DIR) init

# Sobe o Ministack, aguarda, provisiona via Terraform e depois sobe todos os serviços
ifeq ($(OS),Windows_NT)
setup:
	@powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup.ps1
else
setup: .env tf-init
	@echo "[make] Iniciando setup completo..."
	$(COMPOSE) up -d ministack
	@$(MAKE) wait-ministack
	@$(MAKE) tf-apply
	@$(MAKE) sync-vite-gateway
	@echo "[make] Atualizando terraform/rds.env (host RDS pode mudar após rede Docker)..."
	@sh scripts/write-rds-env.sh
	@echo "[make] Rebuild dos MFEs e do shell com variáveis de build atuais..."
	$(COMPOSE) build plus-mfe-auth plus-mfe-ped plus-shell
	@echo "[make] Subindo todos os serviços..."
	$(COMPOSE) up -d
	@echo "[make] Setup concluído."
endif

# Corrige ECONNREFUSED nos MS após terraform apply ou IPs Docker desatualizados
fix-rds:
ifeq ($(OS),Windows_NT)
	@powershell -NoProfile -ExecutionPolicy Bypass -File scripts/fix-rds.ps1
else
	@sh scripts/write-rds-env.sh
	$(COMPOSE) up -d --force-recreate plus-ms-auth plus-ms-ped
endif

# Sobe todos os serviços em modo detached
up: .env
	$(COMPOSE) up -d

# Rebuild da imagem plus-ms-ped após alterações em plus-ms-ped/src (Docker não monta código fonte)
rebuild-ms-ped: .env
	@echo "[make] Rebuild e restart do plus-ms-ped..."
	$(COMPOSE) build plus-ms-ped
	$(COMPOSE) up -d --force-recreate plus-ms-ped
	@echo "[make] plus-ms-ped em http://localhost:3007"

# Rebuild do MFE pedidos + shell (remote OrdersPage e variáveis de build)
rebuild-mfe-ped: .env
	@echo "[make] Rebuild e restart do plus-mfe-ped e plus-shell..."
	$(COMPOSE) build plus-mfe-ped plus-shell
	$(COMPOSE) up -d --force-recreate plus-mfe-ped plus-shell
	@echo "[make] Shell em http://localhost:3000 — MFE pedidos em http://localhost:4007"

# Para e remove os containers
down:
	$(COMPOSE) down

# Acompanha os logs em tempo real
logs:
	$(COMPOSE) logs -f

# Derruba tudo, remove volumes e refaz o setup do zero
reset:
	@echo "[make] Derrubando todos os serviços e removendo volumes..."
	$(COMPOSE) down -v --remove-orphans
	@echo "[make] Reiniciando setup..."
	@$(MAKE) setup

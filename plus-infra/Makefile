.PHONY: setup up down logs reset tf-init tf-apply sync-vite-gateway

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

.env:
	@powershell -NoProfile -ExecutionPolicy Bypass -Command "if (-not (Test-Path '.env')) { Copy-Item '.env.example' '.env'; Write-Host '[make] Arquivo .env não encontrado. Copiado de .env.example.'; Write-Host '[make] Revise JWT_SECRET etc. e rode make setup novamente.'; exit 1 }"

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
	TF_VAR_endpoint=$${AWS_ENDPOINT:-http://localhost:4566} \
	terraform -chdir=$(TF_DIR) apply -auto-approve
	@sh scripts/write-rds-env.sh

sync-vite-gateway:
	@sh scripts/sync-vite-gateway-url.sh

.env:
	@if [ ! -f .env ]; then \
		echo "[make] Arquivo .env não encontrado. Copiando .env.example..."; \
		cp .env.example .env; \
		echo "[make] Edite o arquivo .env com suas configurações e rode make setup novamente."; \
		exit 1; \
	fi

endif

# Inicializa os providers do Terraform
tf-init:
	@echo "[make] Inicializando Terraform..."
	terraform -chdir=$(TF_DIR) init

# Sobe o Ministack, aguarda, provisiona via Terraform e depois sobe todos os serviços
setup: .env tf-init
	@echo "[make] Iniciando setup completo..."
	$(COMPOSE) up -d ministack
	@$(MAKE) wait-ministack
	@$(MAKE) tf-apply
	@$(MAKE) sync-vite-gateway
	@echo "[make] Rebuild do MFE e do shell com variáveis de build atuais..."
	$(COMPOSE) build plus-mfe-auth plus-shell
	@echo "[make] Subindo todos os serviços..."
	$(COMPOSE) up -d
	@echo "[make] Setup concluído."

# Sobe todos os serviços em modo detached
up: .env
	$(COMPOSE) up -d

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

default: rebuild

rebuild:
	-clear
	docker compose down -v --remove-orphans
	docker compose up -d --build
	-docker compose logs -f

# ---------------------------------------------------------------------------
# Analisi statica e test, in locale (stessi comandi usati dalla pipeline CI,
# ../.github/workflows/ci.yml). Presuppongono un virtualenv Python con
# requirements-dev.txt installato in backend/, e `npm install` già eseguito
# in frontend/ (non passano dai container Docker, per un ciclo di feedback
# più rapido durante lo sviluppo). Vedi README.md per il setup iniziale.
# ---------------------------------------------------------------------------

lint: lint-backend lint-frontend

lint-backend:
	cd backend && ruff check .

lint-frontend:
	cd frontend && npx eslint .

lint-fix:
	cd backend && ruff check . --fix
	cd frontend && npm run lint

format: format-backend format-frontend

format-backend:
	cd backend && ruff format .

format-frontend:
	cd frontend && npx prettier --write "src/**/*.{ts,vue,css}"

format-check:
	cd backend && ruff format --check .
	cd frontend && npx prettier --check "src/**/*.{ts,vue,css}"

typecheck: typecheck-backend typecheck-frontend

typecheck-backend:
	cd backend && mypy .

typecheck-frontend:
	cd frontend && npm run type-check

test: test-backend test-frontend

test-backend:
	cd backend && pytest -v

test-frontend:
	cd frontend && npm run test:unit

# Test con coverage (stessa soglia usata in CI: 90% backend, 70% frontend).
coverage: coverage-backend coverage-frontend

coverage-backend:
	cd backend && pytest -v --cov=. --cov-report=term-missing --cov-report=html --cov-fail-under=90
	@echo "Report HTML: backend/htmlcov/index.html"

coverage-frontend:
	cd frontend && npm run test:coverage
	@echo "Report HTML: frontend/coverage/index.html"

# Riproduce in locale, nell'ordine, tutti i job della pipeline CI: se questo
# passa, il push dovrebbe passare anche su GitHub Actions.
ci: lint format-check typecheck test
	cd frontend && npm run build-only

.PHONY: default rebuild lint lint-backend lint-frontend lint-fix format format-backend format-frontend format-check typecheck typecheck-backend typecheck-frontend test test-backend test-frontend coverage coverage-backend coverage-frontend ci
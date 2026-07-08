.PHONY: rebuild test backend-test frontend-test build

default: rebuild


rebuild:
	clear
	docker compose down -v --remove-orphans
	docker compose up -d --build
	docker compose logs -f


backend-test:
	cd backend && pytest


frontend-test:
	cd frontend && npm test


test: backend-test frontend-test

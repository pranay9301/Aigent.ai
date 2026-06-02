.PHONY: help dev build test lint clean deploy deploy-prod deploy-preview install watch

help:
	@echo "Aigent.ai commands"
	@echo "  make install      - install dependencies"
	@echo "  make dev         - start development server"
	@echo "  make build       - production build"
	@echo "  make watch       - production build in watch mode"
	@echo "  make test        - run vitest"
	@echo "  make lint        - TypeScript type check"
	@echo "  make clean       - remove build artifacts"
	@echo "  make deploy      - run automated deploy script for main"
	@echo "  make deploy-prod - run automated deploy script for main"
	@echo "  make deploy-preview - run automated deploy script for preview"

install:
	npm ci

dev:
	npm run dev

build:
	npm run build

watch:
	npm run build -- --watch

test:
	npm test

lint:
	npm run lint

clean:
	rm -rf dist

deploy:
	bash ./scripts/deploy.sh "deploy: automated push $$(date +%Y-%m-%d %H:%M:%S)" main

deploy-prod:
	bash ./scripts/deploy.sh "deploy: production $$(date +%Y-%m-%d %H:%M:%S)" main

deploy-preview:
	bash ./scripts/deploy.sh "deploy: preview $$(date +%Y-%m-%d %H:%M:%S)" preview


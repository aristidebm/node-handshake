help:
	@$(MAKE) -pRrq -f $(lastword $(MAKEFILE_LIST)) : 2>/dev/null | awk -v RS= -F: '/^# File/,/^# Finished Make data base/ {if ($$1 !~ "^[#.]") {print $$1}}' | sort | grep -E -v -e '^[^[:alnum:]]' -e '^$@$$'

build:
	pnpm run build

start:
	pnpm run start

dev:
	pnpm run dev

lint:
	pnpm run lint

format:
	pnpm run lint:fix

install:
	pnpm run install

test:
	pnpm run test

list-migrations:
	pnpm run knex-list

migrate:
	pnpm run knex-migrate

clean:
	@rm -rf dist/*

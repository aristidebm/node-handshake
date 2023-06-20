#!/bin/sh -e

set -e
set -x
npx knex --env=development migrate:latest
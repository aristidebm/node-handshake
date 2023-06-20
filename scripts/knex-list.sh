#!/bin/sh -e

set -e
set -x

npx knex migrate:list
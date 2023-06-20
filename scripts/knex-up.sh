#!/bin/sh -e

# set -e
# set -x

function up() {
    # filename = $1
    # if [[-n filename ]]; then
    #     npx knex migrate:up $filename
    # else
    #     npx knex migrate:up
    # fi
}

up $1
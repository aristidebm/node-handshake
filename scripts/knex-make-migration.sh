#!/bin/sh -e

# set -e
# set -x

# https://knexjs.org/guide/migrations.html#migrations
function make_migration() {
    filename=$1
    echo $filename
    # if [[-n filename ]]; then
    #     npx knex migrate:make filename
    # else
    #     echo "This function expect the migration filename"
    # fi
}

make_migration $1
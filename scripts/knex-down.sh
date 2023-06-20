#!/bin/sh -e

# set -e
# set -x

function down() {
    # filename = $1
    # if [[-n filename ]]; then
    #     npx knex migrate:down $filename
    # else
    #     npx knex migrate:down
    # fi
}

down $1
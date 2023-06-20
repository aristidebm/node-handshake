set -e
set -x

eslint --ext .ts --color --max-warnings 0 src/* tests/*
prettier --check src/*.ts tests/*.ts
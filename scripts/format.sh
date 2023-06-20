#!/bin/sh -e
set -x

eslint --ext .ts --color --fix src/* tests/*
prettier --loglevel warn --write src/*.ts tests/*.ts

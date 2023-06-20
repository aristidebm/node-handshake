import type { Knex } from "knex";
import knex from "knex";
import { knex as config } from "./knexfile";
export const database: Knex = knex(config);

import config from "../../knexfile";
const environment = process.env.NODE_ENV || "development";
const knex = config[environment];
export { knex };
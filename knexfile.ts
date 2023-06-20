import type { Knex } from "knex";
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, ".env.example") });

// Update with your config settings.

// const config: { [key: string]: Knex.Config } = {
//   development: {
//     client: "sqlite3",
//     connection: {
//       filename: "./dev.sqlite3"
//     }
//   },

//   staging: {
//     client: "postgresql",
//     connection: {
//       database: "my_db",
//       user: "username",
//       password: "password"
//     },
//     pool: {
//       min: 2,
//       max: 10
//     },
//     migrations: {
//       tableName: "knex_migrations"
//     }
//   },

//   production: {
//     client: "postgresql",
//     connection: {
//       database: "my_db",
//       user: "username",
//       password: "password"
//     },
//     pool: {
//       min: 2,
//       max: 10
//     },
//     migrations: {
//       tableName: "knex_migrations"
//     }
//   }

// };

const config:  { [key: string]: Knex.Config } = {
    production: {
      client: process.env.DB_CLIENT,
      connection: process.env.DB_URL,
      // client: "sqlite3",
      // connection: "./dev.sqlite3",
      migrations: {
      // generate .ts file as migration
      extension: "ts",
      // migrations locations.
      directory: "./migrations",
    },
    // sqlite does not support inserting default values;
    // useNullAsDefault: true,
  },
  development: {
      client: "sqlite3",
      connection: "./dev.sqlite3",
      migrations: {
      // generate .ts file as migration
      extension: "ts",
      // migrations locations.
      directory: "./migrations",
    },
    // sqlite does not support inserting default values;
    useNullAsDefault: true,
  },
  test: {
      client: "sqlite3",
      connection: "./test.sqlite3",
      migrations: {
      // generate .ts file as migration
      extension: "ts",
      // migrations locations.
      directory: "./migrations",
    },
    // sqlite does not support inserting default values;
    useNullAsDefault: true,
  }
};

export default config;

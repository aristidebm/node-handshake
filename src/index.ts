import * as dotenv from "dotenv";
import path from "path";
import { createApp } from "./app";

const startApp = function () {
  loadEnv();
  const app = createApp();
  app.listen(process.env.PORT, () => {
    console.log(
      `The app is listening on port ${process.env.PORT} in ${process.env.NODE_ENV} environment`
    );
  });
};

const loadEnv = function () {
  dotenv.config({
    path: path.join(
      path.dirname(path.resolve(path.dirname(__dirname))),
      ".env.example"
    ),
  });
};

startApp();

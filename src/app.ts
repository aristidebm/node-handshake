import path from "path";
import express, { Express, json, urlencoded } from "express";
import * as oas from "express-oas-generator";
import { TodoRouter } from "./routes";
import { errorHandler, errorTranslate, requestLogger } from "./middlewares";

const createApp = function (): Express {
  const app: Express = express();
  const prefix = "/api/v1/";
  // tie oas (open api specification generator) to the app.
  oas.handleResponses(app, {
    specOutputFileBehavior: oas.SPEC_OUTPUT_FILE_BEHAVIOR.PRESERVE,
    swaggerDocumentOptions: oas.SwaggerUiOptions,
    // remove trailing and leading slashes otherwise it won't work
    swaggerUiServePath: path.join(prefix, "/docs").replace(/(\/+$|^\/+)/, ''),
    alwaysServeDocs: true,
    specOutputPath: './docs/swagger.json',
    tags: ["Todo"],
    predefinedSpec: function(spec: oas.OpenAPIV2.Document | oas.OpenAPIV3.Document) {
      // customized spec here.
      return spec;
    }
  });


  // setup middlewares
  app.use(json());
  app.use(urlencoded());
  app.use(prefix, TodoRouter);
  app.use(requestLogger);
  app.use(errorTranslate);
  app.use(errorHandler);

  oas.handleRequests();
  return app;
};

export { createApp };

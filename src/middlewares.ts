import { Request, Response, NextFunction } from "express";
import {
  ErrorType,
  ApiErrorFormat,
  NotFound,
  ApiError,
  ValidationError,
  isValidationError,
  translateError,
  ErrorDetail,
  ServerError,
} from "./types";

import * as Dao from "./dao";

const notFound = function (req: Request, res: Response, next: NextFunction) {
  if (!req.route || !req.params.id) {
    return next(new NotFound());
  }
  Dao.retrieveTodo(req.params.id)
    .then((todo) => {
      if (!todo) {
        return next(new NotFound());
      }
    })
    .catch((reason) => {
      next(new ServerError(reason));
    });
  next();
};

const errorTranslate = function (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  next(translateError(err, req, res));
};

const errorHandler = function (
  err: ValidationError | ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // forward server errors to default handler so that we can have
  // stack trace of the error.
  if (res.statusCode === 500 || process.env.NODE_ENV == "development") {
    next(err);
  }
  const error = errorFormatter(err);
  res.status(err.statusCode).json(error);
};

const errorFormatter = function (err: ApiError): ApiErrorFormat {
  const type =
    err.statusCode < 500 ? ErrorType.CLIENT_ERROR : ErrorType.SERVER_ERROR;
  const error: ApiErrorFormat = {
    type,
    errors: [
      {
        code: err.code,
        detail: err.message,
        attr: undefined,
      },
    ],
  };

  let errors: Array<ErrorDetail> = [];

  if (isValidationError(err)) {
    errors = validationErrorFormatter(err);
  }
  error.errors = errors.length ? errors : error.errors;
  return error;
};

const validationErrorFormatter = function (
  err: ValidationError
): Array<ErrorDetail> {
  // FIXME: It does not support converting GroupedAlternativeValidationError yet.

  if (err.errors == undefined || err.errors == null) {
    return [];
  }

  const errors: Array<ErrorDetail> = [];
  let currentError: ErrorDetail;
  let newEr;

  for (const er of err.errors) {
    newEr = er instanceof Array ? er : [er];
    for (const it of newEr) {
      currentError = {
        code: err.code,
        detail: it.msg,
        attr: it.path,
      };
      errors.push(currentError);
    }
  }
  return errors;
};

const requestLogger = function (
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.log(`${req.method.toUpperCase()}  ${req.path}`);
  console.log(
    `${res.statusCode} ${req.headers["content-type"]} ${res.statusMessage}`
  );
  next();
};

export { notFound, errorHandler, errorTranslate, requestLogger };

import {
  Result,
  validationResult,
  matchedData,
  ValidationError as ExpressValidationError,
} from "express-validator";
import { NextFunction, Request, Response } from "express";

enum ErrorType {
  CLIENT_ERROR = "clientError",
  SERVER_ERROR = "serverError",
}

interface IErrorMessage {
  required(): string;

  invalid(): string;

  min(value: number): string;

  max(value: number): string;

  minmax(min: number, max: number): string;

  email(): string;

  phone(): string;
}

// TS enum does not support computed fields
// so we use a simple object instead.
const ErrorMessage: IErrorMessage = {
  required: function (): string {
    return "This field is required";
  },

  invalid: function () {
    return "This field is invalid.";
  },

  min: function (value: number): string {
    return `This field must contains at least ${value} characters.`;
  },

  max: function (value: number): string {
    return `This field must contains at most ${value} characters.`;
  },

  minmax: function (min: number, max: number): string {
    return `This field must contains at least ${min} and at most ${max} characters.`;
  },

  email: function (): string {
    return "This field is an invalid email.";
  },

  phone: function (): string {
    return "This field is an invalid phone number";
  },
};

enum HttpStatusCode {
  HTTP_200_OK = 200,
  HTTP_201_CREATED = 201,
  HTTP_400_BAD_REQUEST = 400,
  HTTP_401_UNAUTHORIZED = 401,
  HTTP_403_FORBIDDEN = 403,
  HTTP_404_NOT_FOUND = 404,
  HTTP_405_METHOD_NOT_ALLOWED = 405,
  HTTP_500_INTERNAL_SERVER_ERROR = 500,
  HTTP_503_SERVICE_UNAVAILABLE = 503,
}

enum HttpMethod {
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
  GET = "GET",
  POST = "POST",
  PATCH = "PATCH",
  PUT = "PUT",
  DELETE = "DELETE",
}

enum ErrorCode {
  VALIDATION_ERROR = "validationError",
  NOT_AUTHENTICATED = "notAuthenticated",
  AUTHENTICATION_FAILED = "authenticatedFailed",
  PERMISSION_DENIED = "permissionDenied",
  NOT_FOUND = "notFound",
  METHOD_NOT_ALLOWED = "methodNotAllowed",
  SERVER_ERROR = "serverError",
  SERVICE_UNAVAILABLE = "serviceUnavailable",
}

interface ErrorDetail {
  code: ErrorCode;
  detail: string;
  attr?: string;
}

interface ApiErrorFormat {
  type: ErrorType;
  errors: Array<ErrorDetail>;
}

class ApiError extends Error {
  message: string;
  code: ErrorCode;
  statusCode: HttpStatusCode;

  constructor(message?: string, statusCode?: HttpStatusCode, code?: ErrorCode) {
    super();
    this.name = this.constructor.name;
    this.message = message ?? "error";
    this.statusCode =
      statusCode ?? HttpStatusCode.HTTP_500_INTERNAL_SERVER_ERROR;
    this.code = code ?? ErrorCode.SERVER_ERROR;
  }
}

class NotFound extends ApiError {
  constructor(message?: string) {
    super(message, HttpStatusCode.HTTP_404_NOT_FOUND, ErrorCode.NOT_FOUND);
    this.message = this.message === message ? this.message : "Not Found";
  }
}

class PermissionDenied extends ApiError {
  constructor(message?: string) {
    super(
      message,
      HttpStatusCode.HTTP_403_FORBIDDEN,
      ErrorCode.PERMISSION_DENIED
    );
    const defaultMessage = "You do not have permission to perform this action.";
    this.message = this.message === message ? this.message : defaultMessage;
  }
}

class NotAuthenticated extends ApiError {
  constructor(message?: string) {
    super(
      message,
      HttpStatusCode.HTTP_401_UNAUTHORIZED,
      ErrorCode.NOT_AUTHENTICATED
    );
    const defaultMessage = "Authentication credentials were not provided.";
    this.message = this.message === message ? this.message : defaultMessage;
  }
}

class AuthenticationFailed extends ApiError {
  constructor(message?: string) {
    super(
      message,
      HttpStatusCode.HTTP_401_UNAUTHORIZED,
      ErrorCode.AUTHENTICATION_FAILED
    );
    const defaultMessage = "Incorrect authentication credentials..";
    this.message = this.message === message ? this.message : defaultMessage;
  }
}
class MethodNotAllowed extends ApiError {
  constructor(method: HttpMethod, message?: string) {
    super(
      message,
      HttpStatusCode.HTTP_405_METHOD_NOT_ALLOWED,
      ErrorCode.METHOD_NOT_ALLOWED
    );
    const defaultMessage = `Method "${method}" not allowed.`;
    this.message = this.message === message ? this.message : defaultMessage;
  }
}

class ValidationError extends ApiError {
  errors?: Array<ExpressValidationError>;
  constructor(message?: string, errors?: Array<ExpressValidationError>) {
    super(
      message,
      HttpStatusCode.HTTP_400_BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
    const defaultMessage = "Invalid input.";
    this.message = this.message === message ? this.message : defaultMessage;
    this.errors = errors;
  }
}

class ParseError extends ApiError {
  constructor(message?: string) {
    super(
      message,
      HttpStatusCode.HTTP_400_BAD_REQUEST,
      ErrorCode.VALIDATION_ERROR
    );
    const defaultMessage = "Malformed request.";
    this.message = this.message === message ? this.message : defaultMessage;
  }
}

class ServerError extends ApiError {
  constructor(message?: string) {
    super(
      message,
      HttpStatusCode.HTTP_500_INTERNAL_SERVER_ERROR,
      ErrorCode.SERVER_ERROR
    );
    const defaultMessage = "Server Error occurred.";
    this.message = this.message === message ? this.message : defaultMessage;
  }
}

class ServiceUnavailable extends ApiError {
  constructor(message?: string) {
    super(
      message,
      HttpStatusCode.HTTP_503_SERVICE_UNAVAILABLE,
      ErrorCode.SERVICE_UNAVAILABLE
    );
    const defaultMessage = "Service is temporary unavailable.";
    this.message = this.message === message ? this.message : defaultMessage;
  }
}

// type predicate: https://www.typescriptlang.org/docs/handbook/2/narrowing.html#using-type-predicates
const isValidationError = function (
  err: ValidationError | ApiError
): err is ValidationError {
  return err instanceof ValidationError;
  // duck typing approach
  // return hasOwn(err, "attr");
};

const isApiError = function (err: ApiError | Error): err is ApiError {
  return err instanceof ApiError;
  // duck typing approach
  // return hasOwn(err, "message") && hasOwn(err, "code") && hasOwn(err, "statusCode");
};

const isExpressValidationError = function (err: unknown): err is Result {
  if (
    (err as Result).mapped &&
    (err as Result).array &&
    (err as Result).throw
  ) {
    return true;
  }
  return false;
};

const validate = function (
  req: Request,
  res: Response,
  next: NextFunction
): Record<string, unknown> {
  const result: Result = validationResult(req);
  if (!result.isEmpty()) {
    res.status(HttpStatusCode.HTTP_400_BAD_REQUEST);
    next(result.throw());
  }
  return matchedData(req);
};

const translateError = function (
  err: Error,
  req: Request,
  res: Response
): ApiError {
  if (isApiError(err)) {
    return err;
  }
  const msg = err.message;
  let error: ApiError;

  switch (res.statusCode) {
    // FIXME: We can have ParseError here, find a way to distinguish them
    case HttpStatusCode.HTTP_400_BAD_REQUEST:
      error = isExpressValidationError(err)
        ? new ValidationError(msg, err.array({ onlyFirstError: true }))
        : new ParseError(msg);
      break;
    // FIXME: We can have AuthenticationFailed here, find a way to distinguish them
    case HttpStatusCode.HTTP_401_UNAUTHORIZED:
      error = new NotAuthenticated(msg);
      break;
    case HttpStatusCode.HTTP_403_FORBIDDEN:
      error = new PermissionDenied();
      break;
    case HttpStatusCode.HTTP_404_NOT_FOUND:
      error = new NotFound();
      break;
    case HttpStatusCode.HTTP_405_METHOD_NOT_ALLOWED:
      // FIXME: Replace HttpMethod.POST by the appropriate method name.
      error = new MethodNotAllowed(HttpMethod.POST, msg);
      break;
    case HttpStatusCode.HTTP_500_INTERNAL_SERVER_ERROR:
      error = new ServerError(msg);
      break;
    case HttpStatusCode.HTTP_503_SERVICE_UNAVAILABLE:
      error = new ServiceUnavailable(msg);
      break;
    default:
      error = new ServerError(msg);
  }
  return error;
};

enum TodoState {
  CREATED = "created",
  IN_PROGRESS = "inProgress",
  DONE = "done",
}
interface Todo {
  title: string;
  description?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface TodoCreate extends Todo {
  //
}

interface TodoRead extends Todo {
  id: string;
  state: TodoState;
  created: Date;
}

interface TodoUpdate {
  title?: string;
  description?: string;
  state?: TodoState;
}

interface TodoFilterSet {
  title?: string;
  state?: TodoCreate;
}

export {
  ApiErrorFormat,
  ErrorCode,
  ErrorType,
  HttpStatusCode,
  ApiError,
  ValidationError,
  ParseError,
  NotAuthenticated,
  AuthenticationFailed,
  PermissionDenied,
  MethodNotAllowed,
  NotFound,
  ServerError,
  ServiceUnavailable,
  isValidationError,
  translateError,
  validate,
  ErrorMessage,
  ErrorDetail,
  TodoRead,
  TodoUpdate,
  TodoCreate,
  TodoState,
  TodoFilterSet,
};

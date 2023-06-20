import { Router, Request, Response, NextFunction } from "express";
import { checkExact, checkSchema } from "express-validator";
import { notFound } from "../middlewares";
import {
  validate,
  ErrorMessage,
  ServerError,
  TodoCreate,
  TodoUpdate,
  TodoState,
  TodoFilterSet,
} from "../types";
import * as Dao from "../dao";

const router = Router();

router.get(
  "/todos",
  checkSchema({
    title: {
      in: "query",
      isString: { errorMessage: ErrorMessage.invalid() },
      optional: true,
    },
    state: {
      in: "query",
      isString: { errorMessage: ErrorMessage.invalid() },
      isIn: { options: [Object.values(TodoState)] }, // get all values from an enum as list.
      errorMessage: `You must provide values in ${Object.values(TodoState)}`,
      optional: true,
    },
  }),
  checkExact([], { locations: ["query"] }), // makes sure only title and state are allowed.
  function (req: Request, res: Response, next: NextFunction) {
    const filters: TodoFilterSet = validate(req, res, next);
    Dao.listTodos(filters)
      .then((todos) => res.status(200).json(todos))
      .catch((reason) => next(new ServerError(reason)));
  }
);

router.post(
  "/todos",
  checkSchema(
    {
      title: {
        notEmpty: { bail: true, errorMessage: ErrorMessage.required() },
        isLength: {
          options: { min: 3, max: 100 },
          errorMessage: ErrorMessage.minmax(3, 100),
        },
      },
      description: {
        isString: { errorMessage: ErrorMessage.invalid() },
        isLength: {
          options: { max: 255 },
          errorMessage: ErrorMessage.max(255),
        },
      },
    },
    ["body"]
  ),
  function (req: Request, res: Response, next: NextFunction) {
    const data = validate(req, res, next);
    const todo: TodoCreate = {
      title: data.title as string,
      description: data?.description as string,
    };
    Dao.createTodo(todo)
      .then((todo) => res.status(201).json(todo))
      .catch((reason) => next(new ServerError(reason)));
  }
);

router.get(
  "/todos/:id",
  checkSchema({
    id: {
      in: "params",
      notEmpty: { errorMessage: ErrorMessage.required() },
      isUUID: { errorMessage: "Invalid UUID" },
    },
  }),
  notFound,
  function (req: Request, res: Response, next: NextFunction) {
    validate(req, res, next);
    Dao.retrieveTodo(req.params.id)
      .then((todo) => res.status(200).json(todo))
      .catch((reason) => next(new ServerError(reason)));
  }
);

router.patch(
  "/todos/:id",
  checkSchema({
    id: {
      in: "params",
      notEmpty: { errorMessage: ErrorMessage.required() },
      isUUID: { errorMessage: "Invalid UUID" },
    },
    title: {
      in: "body",
      isString: { bail: true, errorMessage: ErrorMessage.invalid() },
      isLength: {
        options: { min: 3, max: 100 },
        errorMessage: ErrorMessage.minmax(3, 100),
      },
      optional: true,
    },
    description: {
      in: "body",
      isString: { errorMessage: ErrorMessage.invalid() },
      isLength: { options: { max: 255 }, errorMessage: ErrorMessage.max(255) },
      optional: true,
    },
    state: {
      in: "body",
      // You need to enclose your choices inside another array
      // ike below as stated in the documentation here
      // https://express-validator.github.io/docs/api/check-schema
      isIn: { options: [Object.values(TodoState)] }, // get all values from an enum as list.
      errorMessage: `You must provide values in ${Object.values(TodoState)}`,
      optional: true,
    },
  }),
  notFound,
  function (req: Request, res: Response, next: NextFunction) {
    const data = validate(req, res, next);
    const todo: TodoUpdate = {
      title: data?.title as string,
      description: data?.description as string,
      state: data?.state as TodoState,
    };
    Dao.updateTodo(req.params.id, todo)
      .then((todo) => res.status(200).json(todo))
      .catch((reason) => next(new ServerError(reason)));
  }
);

router.delete(
  "/todos/:id",
  checkSchema({
    id: {
      in: "params",
      notEmpty: { errorMessage: ErrorMessage.required() },
      isUUID: { errorMessage: "Invalid UUID" },
    },
  }),
  notFound,
  function (req: Request, res: Response, next: NextFunction) {
    validate(req, res, next);
    Dao.deleteTodo(req.params.id)
      .then(() => res.status(204).json({}))
      .catch((reason) => next(new ServerError(reason)));
  }
);

export { router };

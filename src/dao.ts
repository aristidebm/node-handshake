import { database } from "./db";
import {
  TodoCreate,
  TodoUpdate,
  TodoRead,
  TodoState,
  TodoFilterSet,
} from "./types";

interface DbTodo {
  id: string;
  title: string;
  description: string;
  state: TodoState;
  created_at: Date;
}

const extractReadTodo = function (dbTodo: DbTodo): TodoRead {
  const todo: TodoRead = {
    id: dbTodo.id,
    title: dbTodo.title,
    description: dbTodo.description,
    state: dbTodo.state,
    created: dbTodo.created_at,
  };
  return todo;
};

const createTodo = function (todo: TodoCreate): Promise<TodoRead> {
  return database<DbTodo>("todos")
    .insert({ title: todo.title, description: todo?.description })
    .returning(["id", "title", "description", "state", "created_at"])
    .then((todos) => extractReadTodo(todos[0]));
};

const updateTodo = function (id: string, todo: TodoUpdate): Promise<TodoRead> {
  return database<DbTodo>("todos")
    .update({
      title: todo?.title,
      description: todo?.description,
      state: todo?.state,
    })
    .where("id", id)
    .returning(["id", "title", "description", "state", "created_at"])
    .then((todos) => extractReadTodo(todos[0]));
};

const listTodos = function (filters?: TodoFilterSet): Promise<TodoRead[]> {
  let queryBuilder = database<DbTodo>("todos");
  queryBuilder = filters ? queryBuilder.where(filters) : queryBuilder;
  return queryBuilder.then((todos) => todos.map(extractReadTodo));
};

const retrieveTodo = function (id: string): Promise<TodoRead | undefined> {
  return database<DbTodo>("todos")
    .where("id", id)
    .then((todos) => {
      if (todos[0]) {
        return extractReadTodo(todos[0]);
      }
    });
};

const deleteTodo = function (id: string): Promise<void> {
  return database<DbTodo>("todos").delete().where("id", id).then();
};

export { createTodo, updateTodo, listTodos, retrieveTodo, deleteTodo };

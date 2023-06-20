process.env.NODE_ENV = "test";

import supertest from "supertest";
import { faker } from "@faker-js/faker";

import { createApp } from "../src/app";
import * as Dao from "../src/dao";
import { database } from "../src/db";
import { TodoState, TodoRead } from "../src/types";
import { migrate, rollback } from "./migrations";

console.log(database);
const client = supertest(createApp());

describe("HappyPathTestSuite", () => {
  beforeEach(migrate);
  afterEach(rollback);

  // An alias of test as stated in the documentation https://jestjs.io/docs/api#testname-fn-timeout
  test("testListTodos", async () => {
    const res = await client.get("/api/v1/todos/");
    expect(res.status).toEqual(200);
    expect(res.headers["content-type"]).toMatch("application/json");
  });

  test("testCreateTodo", async () => {
    const payload = {
      title: faker.string.sample({ min: 3, max: 100 }),
      description: faker.string.sample({ min: 0, max: 100 }),
    };

    const res = await client
      .post("/api/v1/todos/")
      .send(payload)
      .set("Accept", "application/json");

    // http stuff checks
    expect(res.status).toEqual(201);
    expect(res.headers["content-type"]).toMatch("application/json");

    // make sure the response body is the one that we are expecting.
    expect(res.body.id).not.toBeFalsy();
    expect(res.body.title).toEqual(payload.title);
    expect(res.body.description).toEqual(payload.description);
    expect(res.body.created).not.toBeFalsy();
    expect(res.body.state).toEqual(TodoState.CREATED);

    //  make sure data are persisted inside the database.
    const todo = await Dao.retrieveTodo(res.body.id);
    expect(todo?.title).toEqual(payload.title);
    expect(todo?.description).toEqual(payload.description);
  });

  test("testRetrieveTodo", async () => {
    // arrange
    const dbTodo = await Dao.createTodo({
      title: faker.string.sample(),
      description: faker.string.sample(),
    });

    // act
    const res = await client
      .get(`/api/v1/todos/${dbTodo.id}/`)
      .set("Accept", "application/json");

    // assert

    // http stuff checks
    expect(res.status).toEqual(200);
    expect(res.headers["content-type"]).toMatch("application/json");

    // make sure the response body is the one that we are expecting.
    expect(res.body.id).toEqual(dbTodo.id);
    expect(res.body.title).toEqual(dbTodo.title);
    expect(res.body.description).toEqual(dbTodo.description);
    expect(res.body.created).toEqual(dbTodo.created);
    expect(res.body.state).toEqual(dbTodo.state);
  });

  test("testUpdateTodo", async () => {
    // arrange
    const dbTodo = await Dao.createTodo({
      title: faker.string.sample(),
      description: faker.string.sample(),
    });

    const payload = { state: TodoState.IN_PROGRESS };
    expect(dbTodo.state).toEqual(TodoState.CREATED);

    const res = await client
      .patch(`/api/v1/todos/${dbTodo.id}/`)
      .send(payload)
      .set("Accept", "application/json");

    // http stuff checks
    expect(res.status).toEqual(200);
    expect(res.headers["content-type"]).toMatch("application/json");

    // make sure the response body is the one that we are expecting.
    expect(res.body.state).toEqual(TodoState.IN_PROGRESS);
    const updatedTodo = await Dao.retrieveTodo(dbTodo.id);
    expect(updatedTodo?.state).toEqual(TodoState.IN_PROGRESS);
  });

  test("testDeleteTodo", async () => {
    const dbTodo = await Dao.createTodo({
      title: faker.string.sample(),
      description: faker.string.sample(),
    });

    const res = await client
      .delete(`/api/v1/todos/${dbTodo.id}/`)
      .set("Accept", "application/json");

    // http stuff checks
    expect(res.status).toEqual(204);

    // make sure the todo does not exist on the database anymore.
    const deletedTodo = await Dao.retrieveTodo(dbTodo.id);
    expect(deletedTodo).toBeUndefined();
  });

  test("testCanFilterTodosByState", async () => {
    let dbTodo1 = await Dao.createTodo({
      title: faker.string.sample(),
      description: faker.string.sample(),
    });

    let dbTodo2 = await Dao.createTodo({
      title: faker.string.sample(),
      description: faker.string.sample(),
    });

    dbTodo1 = await Dao.updateTodo(dbTodo1.id, { state: TodoState.CREATED });
    dbTodo2 = await Dao.updateTodo(dbTodo2.id, { state: TodoState.DONE });
    expect(dbTodo2.state).toEqual(TodoState.DONE);

    const res = await client
      .get(`/api/v1/todos/`)
      .query({ state: TodoState.DONE })
      .set("Accept", "application/json");

    // http stuff checks
    expect(res.status).toEqual(200);
    expect(res.headers["content-type"]).toMatch("application/json");
    expect(res.body.map((x: TodoRead) => x.id)).not.toContain(dbTodo1.id);
  }),
    test("testCanFilterTodosByTitle", async () => {
      const dbTodo1 = await Dao.createTodo({
        title: "css",
        description: faker.string.sample(),
      });

      const dbTodo2 = await Dao.createTodo({
        title: "html",
        description: faker.string.sample(),
      });

      const res = await client
        .get(`/api/v1/todos/`)
        .query({ title: dbTodo2.title })
        .set("Accept", "application/json");

      // http stuff checks
      expect(res.status).toEqual(200);
      expect(res.headers["content-type"]).toMatch("application/json");
      expect(res.body.map((x: TodoRead) => x.id)).not.toContain(dbTodo1.id);
    });
});

describe("SadPathTestSuite", () => {
  beforeEach(migrate);
  afterEach(rollback);

  test("testCannotCreateTodoWithoutTitle", async () => {
    const payload = {
      description: faker.string.sample({ min: 0, max: 100 }),
    };

    const res = await client
      .post("/api/v1/todos/")
      .send(payload)
      .set("Accept", "application/json");

    // http stuff checks
    expect(res.status).toEqual(400);
    expect(res.headers["content-type"]).toMatch("application/json");

    // make sure the title is the reason of failure
    expect(res.body.errors[0].attr).toEqual("title");
  });

  test("testCannotUpdateUnexcitingTodo", async () => {
    const payload = {
      description: faker.string.sample({ min: 0, max: 100 }),
    };

    const res = await client
      .patch(`/api/v1/todos/${faker.string.uuid()}/`)
      .send(payload)
      .set("Accept", "application/json");

    // http stuff checks
    expect(res.status).toEqual(404);
    expect(res.headers["content-type"]).toMatch("application/json");
  });

  test("testCannotRetrieveUnexcitingTodo", async () => {
    const res = await client
      .get(`/api/v1/todos/${faker.string.uuid()}/`)
      .set("Accept", "application/json");
    // http stuff checks
    expect(res.status).toEqual(404);
    expect(res.headers["content-type"]).toMatch("application/json");
  });

  test("testCannotDeleteUnexcitingTodo", async () => {
    const res = await client
      .delete(`/api/v1/todos/${faker.string.uuid()}/`)
      .set("Accept", "application/json");
    // http stuff checks
    expect(res.status).toEqual(404);
    expect(res.headers["content-type"]).toMatch("application/json");
  });

  test("testShouldRejectUnknownFilters", async () => {
    const res = await client
      .get('/api/v1/todos/')
      .query({ unknown: "unknown" })
      .set("Accept", "application/json");

    // http stuff checks
    expect(res.status).toEqual(400);
    expect(res.headers["content-type"]).toMatch("application/json");
    expect(res.body.errors[0].detail).toMatch(/Unknown field/);
  });
});

describe("OpenApiDocumentationTestSuite", () => {
  test("canGetDocumentationSchema", async () => {
      const res = await client
      .get('/api/v1/docs/api-spec/')
      .set("Accept", "application/json");
      expect(res.status).toEqual(200);
  });

  test("canGetV2Documentation", async () => {
      const res = await client
      .get('/api/v1/docs/v2/')
      .set("Accept", "application/json");
      expect(res.status).toEqual(200);
  });

  test("canGetV3Documentation", async () => {
      const res = await client
      .get('/api/v1/docs/v3/')
      .set("Accept", "application/json");
      expect(res.status).toEqual(200);
  });
});

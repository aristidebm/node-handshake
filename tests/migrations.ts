import { database } from "../src/db";

const migrate = function (done: jest.DoneCallback) {
  database.migrate.rollback().then(function () {
    database.migrate.latest().then(function () {
      done();
      // return database.seed.run()
      // .then(function() {
      //   done();
      // });
    });
  });
};

const rollback = function (done: jest.DoneCallback) {
  database.migrate.rollback().then(() => done());
};

export { migrate, rollback };

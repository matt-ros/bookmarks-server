const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { makeBookmarksArray } = require('./bookmarks.fixtures');

describe.only('Bookmarks Endpoints', function() {
  let db;

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    });
    app.set('db', db);
  });

  before('clean the table', () => db('bookmarks_table').truncate());

  afterEach('cleanup', () => db('bookmarks_table').truncate());

  after('disconnect from db', () => db.destroy());

  describe('Unauthorized requests', () => {
    it('responds 401 Unauthorized for GET /bookmarks', () => {
      return supertest(app)
        .get('/bookmarks')
        .expect(401, { error: 'Unauthorized request' });
    });
    
    it('responds 401 Unauthorized for POST /bookmarks', () => {
      const bookmarkToGet = 2;
      return supertest(app)
        .post(`/bookmarks`)
        .send({ title: 'test title', url: 'http://www.test.com', rating: 2 })
        .expect(401, { error: 'Unauthorized request' });
    });
    
    it('responds 401 Unauthorized for GET /bookmarks/:id', () => {
      const bookmarkToGet = 2;
      return supertest(app)
        .get(`/bookmarks/${bookmarkToGet}`)
        .expect(401, { error: 'Unauthorized request' });
    });
    
    it('responds 401 Unauthorized for DELETE /bookmarks/:id', () => {
      const bookmarkToDelete = 2;
      return supertest(app)
        .delete(`/bookmarks/${bookmarkToDelete}`)
        .expect(401, { error: 'Unauthorized request' });
    });    
  });

  describe('GET /bookmarks', () => {
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert articles', () => {
        return db
          .insert(testBookmarks)
          .into('bookmarks_table');
      });

      it('responds with 200 and all of the bookmarks', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, testBookmarks);
      });
    });

    context('Given no bookmarks', () => {
      it('responds with 200 and an empty array', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, []);
      });
    });
  });

  describe('GET /bookmarks/:id', () => {
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert bookmarks', () => {
        return db
          .insert(testBookmarks)
          .into('bookmarks_table');
      });

      it('responds with 200 and the correct bookmark if the bookmark exists', () => {
        const bookmarkId = 2;
        const expectedBookmark = testBookmarks[bookmarkId - 1];
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200, expectedBookmark);
      });

      it(`responds 404 if the bookmark doesn't exist`, () => {
        const bookmarkId = 123456;
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: {message: `Bookmark doesn't exist` } });
      });
    });

    context('Given no bookmarks', () => {
      it('responds 404', () => {
        const bookmarkId = 123456;
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: {message: `Bookmark doesn't exist` } });
      });
    });
  });
});
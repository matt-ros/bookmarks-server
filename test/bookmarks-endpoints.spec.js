const { expect } = require('chai');
const knex = require('knex');
const supertest = require('supertest');
const app = require('../src/app');
const { makeBookmarksArray, makeMaliciousBookmark } = require('./bookmarks.fixtures');

describe('Bookmarks Endpoints', function() {
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

    context('Given an XSS attack bookmark', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
      beforeEach('insert malicious bookmark', () => {
        return db
          .insert(maliciousBookmark)
          .into('bookmarks_table');
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body[0].title).to.eql(expectedBookmark.title);
            expect(res.body[0].description).to.eql(expectedBookmark.description);
          });
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
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });

    context('Given no bookmarks', () => {
      it('responds 404', () => {
        const bookmarkId = 123456;
        return supertest(app)
          .get(`/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: { message: `Bookmark doesn't exist` } });
      });
    });

    context('Given an XSS attack bookmark', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
      beforeEach('insert malicious bookmark', () => {
        return db
          .insert(maliciousBookmark)
          .into('bookmarks_table');
      });

      it('removes XSS attack content', () => {
        return supertest(app)
          .get(`/bookmarks/${maliciousBookmark.id}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(200)
          .expect(res => {
            expect(res.body.title).to.eql(expectedBookmark.title);
            expect(res.body.description).to.eql(expectedBookmark.description);
          });
      });
    });
  });

  describe('POST /bookmarks', () => {
    it('creates a bookmark, responding with 201 and the bookmark', () => {
      const newBookmark = {
        title: 'Test new bookmark',
        url: 'http://www.testbookmark.com',
        description: 'Test new bookmark description...',
        rating: '3'
      };
      return supertest(app)
        .post('/bookmarks')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(newBookmark.title);
          expect(res.body.url).to.eql(newBookmark.url);
          expect(res.body.description).to.eql(newBookmark.description);
          expect(res.body.rating).to.eql(newBookmark.rating);
          expect(res.body).to.have.property('id');
        })
        .then(postRes => 
          supertest(app)
            .get(`/bookmarks/${postRes.body.id}`)
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(postRes.body)
        );
    });

    it('creates a bookmark with no description', () => {
      const newBookmark = {
        title: 'Test new bookmark',
        url: 'http://www.testbookmark.com',
        rating: '3'
      };
      return supertest(app)
        .post('/bookmarks')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .send(newBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body).to.not.have.property('description');
        });
    });

    const requiredFields = ['title', 'url', 'rating'];

    requiredFields.forEach(field => {
      const newBookmark = {
        title: 'Test new bookmark',
        url: 'http://www.testbookmark.com',
        rating: '3'
      };

      it(`responds with 400 and an error message when the '${field}' is missing`, () => {
        delete newBookmark[field];
        return supertest(app)
          .post('/bookmarks')
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .send(newBookmark)
          .expect(400, 'Invalid data')
      });
    });

    it('responds 400 if the rating is invalid', () => {
      const newBookmark = {
        title: 'Test new bookmark',
        url: 'http://www.testbookmark.com',
        rating: 'wrong'
      };
      return supertest(app)
        .post('/bookmarks')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .send(newBookmark)
        .expect(400, 'Invalid data');
    });

    it('responds 400 if the url is invalid', () => {
      const newBookmark = {
        title: 'Test new bookmark',
        url: 'htp:/badurl',
        rating: '3'
      };
      return supertest(app)
        .post('/bookmarks')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .send(newBookmark)
        .expect(400, 'Invalid data');
    });

    it('removes XSS attack content from response', () => {
      const { maliciousBookmark, expectedBookmark } = makeMaliciousBookmark();
      return supertest(app)
        .post('/bookmarks')
        .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
        .send(maliciousBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.eql(expectedBookmark.title)
          expect(res.body.description).to.eql(expectedBookmark.description)
        });
    });
  });

  describe('DELETE /bookmarks/:id', () => {
    context('Given no bookmarks', () => {
      it('responds with 404', () => {
        const bookmarkId = 123456;
        return supertest(app)
          .delete(`/bookmarks/${bookmarkId}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, { error: {message: `Bookmark doesn't exist` } });
      });
    });
    context('Given there are bookmarks in the database', () => {
      const testBookmarks = makeBookmarksArray();
      beforeEach('insert bookmarks', () => {
        return db
          .insert(testBookmarks)
          .into('bookmarks_table');
      });

      it('responds with 204 and removes the bookmark', () => {
        const idToRemove = 2;
        const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove);
        return supertest(app)
          .delete(`/bookmarks/${idToRemove}`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(204)
          .then(res =>
            supertest(app)
            .get('/bookmarks')
            .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
            .expect(expectedBookmarks)
          );
      });
    });
  });
});
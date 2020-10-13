const express = require('express');
const { isWebUri } = require('valid-url');
const logger = require('../logger');
const xss = require('xss');
const BookmarksService = require('./bookmarks-service');

const bookmarkRouter = express.Router();
const bodyParser = express.json();

const sanitizeBookmark = bookmark => {
  const sanBmark = {
    id: bookmark.id,
    title: xss(bookmark.title),
    url: bookmark.url,
    rating: bookmark.rating
  };
  if (bookmark.description) {
    sanBmark.description = xss(bookmark.description);
  }
  return sanBmark;
}

bookmarkRouter
  .route('/bookmarks')
  .get((req, res, next) => {
    const knexInstance = req.app.get('db');
    BookmarksService.getAllBookmarks(knexInstance)
      .then(allBookmarks => {
        res.json(allBookmarks.map(sanitizeBookmark));
      })
      .catch(next);
  })
  .post(bodyParser, (req, res, next) => {
    const { title, url, description, rating } = req.body;
    const newBookmark = { title, url, rating };

    for (const [key, value] of Object.entries(newBookmark)) {
      if (value == null) {
        logger.error(`${key} is required`);
        return res.status(400).send('Invalid data');
      }
    }
    if (description) {
      newBookmark.description = description;
    }

    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 0 || numRating > 5) {
      logger.error(`Invalid rating '${rating}' supplied`);
      return res.status(400).send('Invalid data');
    }

    if (!isWebUri(url)) {
      logger.error(`Invalid url '${url}' supplied`);
      return res.status(400).send('Invalid data');
    }

    BookmarksService.insertBookmark(
      req.app.get('db'),
      newBookmark
    )
    .then(bookmark => {
      logger.info(`Bookmark with id ${bookmark.id} created.`);
      res
        .status(201)
        .location(`/bookmarks/${bookmark.id}`)
        .json(sanitizeBookmark(bookmark));
    })
    .catch(next);
  });

bookmarkRouter
  .route('/bookmarks/:id')
  .all((req, res, next) => {
    BookmarksService.getBookmarkById(
      req.app.get('db'),
      req.params.id
    )
    .then(bookmark => {
      if (!bookmark) {
        logger.error(`Bookmark with id ${req.params.id} not found`)
        return res.status(404).json({
          error: { message: `Bookmark doesn't exist` }
        });
      }
      res.bookmark = bookmark;
      next();
    })
    .catch(next);
  })
  .get((req, res, next) => {
    res.json(sanitizeBookmark(res.bookmark));
  })
  .delete((req, res, next) => {
    BookmarksService.deleteBookmark(
      res.app.get('db'),
      req.params.id
    )
    .then(() => {
      logger.info(`Bookmark with id ${req.params.id} deleted.`);
      res.status(204).end();
    })
    .catch(next);
  });

module.exports = bookmarkRouter;
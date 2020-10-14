const logger = require('../logger');
const { isWebUri } = require('valid-url');

const noError = null;

function validator(bookmark) {
  const numRating = Number(bookmark.rating);
  if (bookmark.rating &&
    !Number.isInteger(numRating) || numRating < 0 || numRating > 5) {
    logger.error(`Invalid rating '${bookmark.rating}' supplied`);
    return 'Invalid data'
  }

  if (bookmark.url && !isWebUri(bookmark.url)) {
    logger.error(`Invalid url '${bookmark.url}' supplied`);
    return 'Invalid data'
  }

  return noError
}

module.exports = { validator }
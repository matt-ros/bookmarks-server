const BookmarksService = {
  getAllBookmarks(knex) {
    return knex.select('*').from('bookmarks_table');
  },
  getBookmarkById(knex, id) {
    return knex
      .select('*')
      .from('bookmarks_table')
      .where({ id })
      .first();
  }
}

module.exports = BookmarksService;
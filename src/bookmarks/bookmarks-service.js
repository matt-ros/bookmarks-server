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
  },
  insertBookmark(knex, newBookmark) {
    return knex
      .insert(newBookmark)
      .into('bookmarks_table')
      .returning('*')
      .then(rows => {
        return rows[0]
      });
  },
  deleteBookmark(knex, id) {
    return knex('bookmarks_table')
      .where({ id })
      .delete();
  }
}

module.exports = BookmarksService;
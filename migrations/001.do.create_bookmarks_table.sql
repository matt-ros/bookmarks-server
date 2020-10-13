CREATE TYPE star_rating AS ENUM(
  '1',
  '2',
  '3',
  '4',
  '5'
);

CREATE TABLE bookmarks_table (
  id INTEGER PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  rating star_rating DEFAULT '1' NOT NULL
);
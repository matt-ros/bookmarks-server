function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'Fake Website 1',
      url: 'http://www.fake1website.com',
      description: 'This is the first fake bookmark',
      rating: 2
    },
    {
      id: 2,
      title: 'Fake Website 2',
      url: 'http://www.fake2website.com',
      description: 'This is the second fake bookmark',
      rating: 2
    },
    {
      id: 3,
      title: 'Fake Website 3',
      url: 'http://www.fake3website.com',
      description: 'This is the third fake bookmark',
      rating: 2
    },
    {
      id: 4,
      title: 'Fake Website 4',
      url: 'http://www.fake4website.com',
      description: 'This is the fourth fake bookmark',
      rating: 2
    }
  ];
}

module.exports = {
  makeBookmarksArray
}
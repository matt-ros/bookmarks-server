function makeBookmarksArray() {
  return [
    {
      id: 1,
      title: 'Fake Website 1',
      url: 'http://www.fake1website.com',
      description: 'This is the first fake bookmark',
      rating: '2'
    },
    {
      id: 2,
      title: 'Fake Website 2',
      url: 'http://www.fake2website.com',
      description: 'This is the second fake bookmark',
      rating: '2'
    },
    {
      id: 3,
      title: 'Fake Website 3',
      url: 'http://www.fake3website.com',
      description: 'This is the third fake bookmark',
      rating: '2'
    },
    {
      id: 4,
      title: 'Fake Website 4',
      url: 'http://www.fake4website.com',
      description: 'This is the fourth fake bookmark',
      rating: '2'
    }
  ];
}

function makeMaliciousBookmark() {
  const maliciousBookmark = {
    id: 911,
    title: 'Naughty naughty very naughty <script>alert("xss");</script>',
    url: 'http://badwebsite.com',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist" onerror="alert(document.cookie);">. But not <strong>all</strong> bad.`,
    rating: '1'
  }
  const expectedBookmark = {
    ...maliciousBookmark,
    title: 'Naughty naughty very naughty &lt;script&gt;alert(\"xss\");&lt;/script&gt;',
    description: `Bad image <img src="https://url.to.file.which/does-not.exist">. But not <strong>all</strong> bad.`
  }
  return {
    maliciousBookmark,
    expectedBookmark
  }
}

module.exports = {
  makeBookmarksArray,
  makeMaliciousBookmark
}
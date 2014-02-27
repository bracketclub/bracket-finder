bracket-finder
==============

[![NPM](https://nodei.co/npm/bracket-finder.png)](https://nodei.co/npm/bracket-finder/)

[![Build Status](https://travis-ci.org/tweetyourbracket/bracket-finder.png?branch=master)](https://travis-ci.org/tweetyourbracket/bracket-finder)

![Testling CI badge](https://ci.testling.com/tweetyourbracket/bracket-finder.png)

Find an NCAA tournament bracket in a tweet (or any data object).

## Why is this useful?

For [tweetyourbracket.com](http://tweetyourbracket.com), users enter by tweeting a link to their bracket. This module can parse a tweet and determine if it contains a valid bracket. It also has a lower level method `find` that can be used to find a tweet in a more generic data object.

## How does it determine if a bracket is found?

1. It will check whether any links are from `options.domain`
2. If that fails, it will check whether any of the tags match a tag from `options.tags`

If both of those fail, it will fire the callback with an error (unless `forceMatch` contains either `tags` or `domain`). After that it will look for a bracket in:

1. Any of the urls that match the domain
2. Any of the tags
3. Any chunks of text (split by spaces)

If any of these find a bracket, it will be [validated](https://github.com/tweetyourbracket/bracket-validator) the result will be passed to the callback. If no bracket is still found, any URLs will be followed using [simple-realurl](https://github.com/lukekarrys/simple-node-realurl) and checked again to see if they match the domain and contain a bracket.

## API / Usage

Make a new `bracket-finder` object with an options object (the year and sport options are required and passed directly to [`bracket-data`](https://github.com/tweetyourbracket/bracket-data#which-sports-does-it-have)):

```js
var BracketFinder = require('bracket-finder');
var finder = new BracketFinder({
   year: '2013',
   sport: 'ncaa-mens-basketball',
   domain: 'tweetyourbracket.com',
   tags: ['tybrtk']
});
finder.tweet(tweet, function (err, bracket) {
    if (err) return; // No bracket found
    // Do something with bracket
});
```

### options

- `sport`: The sport you are validating. See [`bracket-data`](https://github.com/tweetyourbracket/bracket-data#api) for more info.
- `year`: The year you are validating. See [`bracket-data`](https://github.com/tweetyourbracket/bracket-data#api) for more info.
- `domain`: (String, default: '') The domain that a bracket tweet or data object might contain
- `tags`: (Array, default: []) An array of (hash)tags (but without the `#`) that a bracket tweet or data object might contain
- `forceMatch`: (Array, default: ['tags']) Indicates which properties must be specified in the data. Can contain `tags`, `domain`, both or neither
- `allowCrossDomain`: (Boolean, default: depends on environment) By default if you run this in a browser, cross domain urls will not be requested. If you would like to change this, set the option to `true`. When running in node, it defaults to true.

### methods

- `tweet(tweetObject, cb)`: tweetObject should in the format of a tweet from Twitter's API
- `find(dataObject, cb)`: dataObject should have the following:
```js
{
    urls: ['http://tweetyourbracket.com/X'],
    tags: ['tybrkt']
    text: 'This is the text!'
}
```


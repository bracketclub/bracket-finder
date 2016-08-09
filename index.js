var async = require('async')
var parseUrl = require('url').parse
var realurl = require('simple-realurl')
var BracketValidator = require('bracket-validator')
var bracketData = require('bracket-data')
var _map = require('lodash/map')
var _find = require('lodash/find')
var _defaults = require('lodash/defaults')
var _filter = require('lodash/filter')
var _without = require('lodash/without')
var _bind = require('lodash/bind')
var _compact = require('lodash/compact')
var _intersection = require('lodash/intersection')
var _includes = require('lodash/includes')
var _partial = require('lodash/partial')

function Finder (options) {
  _defaults(options, {
    domain: '',
    tags: [],
    forceMatch: ['tags'],
    // By default dont follow cross domain links if we are in a browser
    followCrossDomain: typeof window === 'undefined'
  })

  this.domain = options.domain
  this.tags = options.tags
  this.forceMatch = options.forceMatch || []
  this.followCrossDomain = options.followCrossDomain

  // Create regexes and validator for later use
  var bracketRegex = bracketData({
    sport: options.sport,
    year: options.year
  }).regex

  var fullBracketRegex = new RegExp('^' + bracketRegex.source + '$')

  var validator = new BracketValidator({
    sport: options.sport,
    year: options.year,
    testOnly: true,
    allowEmpty: false
  })

  // Create helper functions
  this.validate = function (bracket, cb) {
    var validated = validator.validate(bracket)
    cb(
      validated instanceof Error ? validated : null,
      validated instanceof Error ? null : validated
    )
  }

  this.findBracket = function (from) {
    return _find(from, function (item) {
      return fullBracketRegex.test(item)
    })
  }

  this.domainUrls = _partial(function (domain, url) {
    return url.toLowerCase().indexOf(domain.toLowerCase()) > -1
  }, this.domain)

  this.bracketUrls = function (url) {
    var matches = url.match(bracketRegex)
    return matches && matches.length > 0 ? matches[0] : matches
  }

  this.canGetUrl = _partial(function (followCrossDomain, url) {
    if (typeof window === 'undefined') {
      return true
    } else {
      var parsedUrl = parseUrl(url)
      var location = window.location
      return (location.protocol === parsedUrl.protocol && location.host === parsedUrl.host) || followCrossDomain
    }
  }, this.followCrossDomain)
}

Finder.prototype.tweet = function (tweet, cb) {
  _defaults(tweet, {text: '', entities: {}})
  this.find({
    urls: _map(tweet.entities.urls, 'expanded_url'),
    tags: _map(tweet.entities.hashtags, 'text'),
    text: tweet.text.split(' ')
  }, cb)
}

Finder.prototype.find = function (data, cb) {
  var self = this
  var appUrls = _filter(data.urls, this.domainUrls)

  if (_includes(this.forceMatch, 'tags') && _intersection(this.tags, data.tags).length === 0) {
    return cb(new Error('Data does not match tags'))
  } else if (_includes(this.forceMatch, 'domain') && appUrls.length === 0) {
    return cb(new Error('Data does not match domain'))
  }

  var urlMatches = _compact(_map(appUrls, this.bracketUrls))
  var dataTags = _without(data.tags, this.tags)
  var textChunks = data.text

  async.waterfall([
    function (_cb) {
      // Most common scenario will be a tweetyourbracket.com url with a hash on it
      // Then test for a valid hashtag
      // Also test for a chunk of text that looks good
      _cb(null, self.findBracket(urlMatches) || self.findBracket(dataTags) || self.findBracket(textChunks))
    },
    function (bracket, _cb) {
      if (bracket) return _cb(null, bracket)
      // Last, check other urls to see if the are tweetyourbracket urls
      var otherUrls = _filter(_without(data.urls, appUrls), self.canGetUrl)
      async.concat(otherUrls, _bind(realurl.get, realurl), function (err, longUrls) {
        if (err) return _cb(err, null)

        var longAppUrls = _filter(longUrls, self.domainUrls)
        var longUrlMatches = _compact(_map(longAppUrls, self.bracketUrls))
        var longBracket = self.findBracket(longUrlMatches)

        _cb(longBracket ? null : new Error('No bracket in tweet'), longBracket || null)
      })
    }
  ], function (err, res) {
    if (err) return cb(err, null)
    self.validate(res, cb)
  })
}

module.exports = Finder

var async = require('async'),
    realurl = require('simple-realurl'),
    BracketValidator = require('bracket-validator'),
    BracketData = require('bracket-data'),
    _map = require('lodash-node/modern/collections/map'),
    _find = require('lodash-node/modern/collections/find'),
    _defaults = require('lodash-node/modern/objects/defaults'),
    _pluck = require('lodash-node/modern/collections/pluck'),
    _filter = require('lodash-node/modern/collections/filter'),
    _without = require('lodash-node/modern/arrays/without'),
    _bind = require('lodash-node/modern/functions/bind'),
    _compact = require('lodash-node/modern/arrays/compact');


function Finder(options) {
    BracketData.call(this, options, {
        domain: '',
        hashtags: []
    });
}

Finder.prototype = Object.create(BracketData.prototype, {
    constructor: {
        value: Finder
    }
});

Finder.prototype.getAppUrls = function (url) {
    return url.indexOf(this.domain) > -1;
};

Finder.prototype.urlsToMatches = function (url) {
    var matches = url.match(this.regex);
    return matches.length > 0 ? matches[0] : matches;
};

Finder.prototype.looksGood = function (item) {
    var regExp = new RegExp('^' + this.regex.source + '$');
    return regExp.test(item);
};

Finder.prototype.findFrom = function (from) {
    return _find(from, this.looksGood, this);
};

Finder.prototype.find = function (tweet, cb) {

    var self = this;

    tweet = _defaults(tweet, {text: '', entities: {}});

    var expandedUrls = _pluck(tweet.entities.urls, 'expanded_url'),
        appUrls = _filter(expandedUrls, this.getAppUrls, this),
        urlMatches = _compact(_map(appUrls, this.urlsToMatches, this)),
        otherUrls = _without(expandedUrls, appUrls),
        hashtags = _without(_pluck(tweet.entities.hashtags, 'text'), this.hashtags),
        textChunks = tweet.text.split(' ');


    async.waterfall([
        function (_cb) {
            // Most common scenario will be a t.co shortened tweetyourbracket.com url with a hash on it
            // Then test for a valid hashtag
            // Also test for a chunk of text that looks good
            _cb(null, self.findFrom(urlMatches) || self.findFrom(hashtags) || self.findFrom(textChunks));
        },
        function (bracket, _cb) {
            if (bracket) return _cb(null, bracket);
            // Last, check shortened urls to see if the are tweetyourbracket urls
            async.concat(otherUrls, _bind(realurl.get, realurl), function (err, realUrls) {
                if (err) return _cb(err, null);
                var appUrls = _filter(realUrls, self.getAppUrls, self),
                    urlMatches = _compact(_map(appUrls, self.urlsToMatches, self)),
                    bracket = self.findFrom(urlMatches);

                _cb(null, bracket);
            });
        }
    ], function (err, res) {
        self.validate(res, cb);
    });

};

Finder.prototype.validate = function (bracket, cb) {
    var validate = new BracketValidator({
        flatBracket: bracket,
        testOnly: true,
        notEmpty: true,
        year: this.year
    }).validate();
    cb(validate instanceof Error ? validate : null, validate instanceof Error ? null : validate);
};

module.exports = Finder;

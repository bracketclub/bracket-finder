var APP_NAME = 'lukekarrys.com',
    APP_HASHTAGS = ['tybrkt'],
    _cloneDeep = function (obj) {return JSON.parse(JSON.stringify(obj)); },
    year = '2013',
    sport = 'ncaam',
    BracketFinder = require('../index'),
    bf = new BracketFinder({
        domain: APP_NAME,
        tags: APP_HASHTAGS,
        year: year,
        sport: sport
    }),
    bd = require('bracket-data'),
    emptyBracket = new bd({
        year: year,
        sport: sport
    }).constants.EMPTY,
    BracketGenerator = require('bracket-generator'),
    generatedBracket = new BracketGenerator({
        year: year,
        sport: sport,
        winners: 'lower'
    }),
    bracket = generatedBracket.generate(),
    assert = require('assert'),

    fullTweet = {
        text: 'There is no important' + bracket + 'text in this tweet',
        entities: {
            urls: [{
                expanded_url: 'http://lukecod.es/#' + bracket
            }, {
                expanded_url: 'http://is.gd/WpcYwJ' // espn.com
            }],
            hashtags: [{
                text: APP_HASHTAGS[0]
            }]
        }
    },

    goodUrl = {expanded_url: 'http://' + APP_NAME + '/#' + bracket},
    goodText = 'Some text of ' + bracket + ' the tweet',
    goodHashtag = {text: bracket},

    shortenedUrl = 'http://bit.ly/19ZYSVj'; //http://lukekarrys.com/#MW185463721432121W185463721432121S185463721432121E185463721432121FFMWSMW

describe('Bracket Finder', function () {

    it('should return a valid bracket from the url', function (done) {
        var testTweet = _cloneDeep(fullTweet);
        testTweet.entities.urls.push(goodUrl);
        bf.tweet(testTweet, function (err, res) {
            assert.equal(bracket, res);
            done();
        });
    });

    it('should return a valid bracket from the text', function (done) {
        var testTweet = _cloneDeep(fullTweet);
        testTweet.text = goodText;
        bf.tweet(testTweet, function (err, res) {
            assert.equal(bracket, res);
            done();
        });
    });

    it('should return a valid bracket from the hashtags', function (done) {
        var testTweet = _cloneDeep(fullTweet);
        testTweet.entities.hashtags.push(goodHashtag);
        bf.tweet(testTweet, function (err, res) {
            assert.equal(bracket, res);
            done();
        });
    });

    it('should not return a bracket from a tweet that does not match tags', function (done) {
        bf.tweet({text: 'Test', entities: {urls: [], hashtags: []}}, function (err, res) {
            assert.equal(null, res);
            assert.equal(true, err instanceof Error);
            assert.equal(err.message, 'Data does not match tags');
            done();
        });
    });

    it('should not return a bracket from a tweet that does not match domain', function (done) {
        var bracketFinder = new BracketFinder({
            domain: APP_NAME,
            tags: APP_HASHTAGS,
            year: year,
            sport: sport,
            forceMatch: ['domain']
        });

        bracketFinder.tweet({text: 'Test', entities: {urls: [], hashtags: []}}, function (err, res) {
            assert.equal(null, res);
            assert.equal(true, err instanceof Error);
            assert.equal(err.message, 'Data does not match domain');
            done();
        });
    });

    it('should not return a bracket from a tweet that does not match domain and tags when a tag is set', function (done) {
        var bracketFinder = new BracketFinder({
            domain: APP_NAME,
            tags: APP_HASHTAGS,
            year: year,
            sport: sport,
            forceMatch: ['domain', 'tags']
        });

        bracketFinder.tweet({text: 'Test', entities: {urls: [], hashtags: [{text: 'tybrkt'}]}}, function (err, res) {
            assert.equal(null, res);
            assert.equal(true, err instanceof Error);
            assert.equal(err.message, 'Data does not match domain');
            done();
        });
    });

    it('should not return a bracket from a tweet that does not match domain and tags when a domain is set', function (done) {
        var bracketFinder = new BracketFinder({
            domain: APP_NAME,
            tags: APP_HASHTAGS,
            year: year,
            sport: sport,
            forceMatch: ['domain', 'tags']
        });

        bracketFinder.tweet({text: 'Test', entities: {urls: [goodUrl], hashtags: []}}, function (err, res) {
            assert.equal(null, res);
            assert.equal(true, err instanceof Error);
            assert.equal(err.message, 'Data does not match tags');
            done();
        });
    });

    it('should not force domain or tags when option is an empty array', function (done) {
        var bracketFinder = new BracketFinder({
            domain: APP_NAME,
            tags: APP_HASHTAGS,
            year: year,
            sport: sport,
            forceMatch: null
        });

        bracketFinder.tweet({text: 'Test', entities: {urls: [], hashtags: []}}, function (err, res) {
            assert.equal(null, res);
            assert.equal(true, err instanceof Error);
            assert.equal(err.message, 'No bracket in tweet');
            done();
        });
    });

    it('should not return a bracket from a bad tweet', function (done) {
        bf.tweet({text: 'Test', entities: {urls: [], hashtags: [{text: 'tybrkt'}]}}, function (err, res) {
            assert.equal(null, res);
            assert.equal(true, err instanceof Error);
            assert.equal(err.message, 'No bracket in tweet');
            done();
        });
    });

    it('should not a validate bracket if bracket is incomplete', function (done) {
        bf.tweet({text: emptyBracket, entities: {urls: [], hashtags: [{text: 'tybrkt'}]}}, function (err, res) {
            assert.equal(null, res);
            assert.equal(true, err instanceof Error);
            assert.equal(err.message, 'Bracket has unpicked matches');
            done();
        });
    });

    it('should return a valid bracket from a shortened url (unless in a browser)', function (done) {
        var bff = new BracketFinder({
            domain: APP_NAME,
            tags: APP_HASHTAGS,
            year: year,
            sport: sport
        });
        var testTweet = _cloneDeep(fullTweet);
        testTweet.entities.urls.push({expanded_url: shortenedUrl});
        bff.tweet(testTweet, function (err, res) {
            if (typeof window === 'undefined') {
                assert.equal(null, err);
                assert.equal(bracket, res);
                done();
            } else {
                assert.equal(null, res);
                assert.equal(true, err instanceof Error);
                assert.equal(err.message, 'No bracket in tweet');
                done();
            }
        });
    });

    it('should not return a bracket from a bad tweet', function (done) {
        var testTweet = _cloneDeep(fullTweet);
        bf.tweet(testTweet, function (err, res) {
            assert.equal(null, res);
            assert.equal(true, err instanceof Error);
            assert.equal(err.message, 'No bracket in tweet');
            done();
        });
    });

});
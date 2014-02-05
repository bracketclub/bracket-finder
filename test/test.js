var APP_NAME = 'lukekarrys.com',
    APP_HASHTAGS = ['tybrkt'],
    _cloneDeep = require('lodash-node/modern/objects/cloneDeep'),
    year = process.env.BRACKET_YEAR,
    BracketFinder = require('../index'),
    bf = new BracketFinder({
        domain: APP_NAME,
        hashtags: APP_HASHTAGS,
        year: year
    }),
    BracketGenerator = require('bracket-generator'),
    generatedBracket = new BracketGenerator({
        year: year,
        winners: 'lower'
    }),
    bracket = generatedBracket.flatBracket(),
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
        bf.find(testTweet, function (err, res) {
            assert.equal(bracket, res);
            done();
        });
    });

    it('should return a valid bracket from the text', function (done) {
        var testTweet = _cloneDeep(fullTweet);
        testTweet.text = goodText;
        bf.find(testTweet, function (err, res) {
            assert.equal(bracket, res);
            done();
        });
    });

    it('should return a valid bracket from the hashtags', function (done) {
        var testTweet = _cloneDeep(fullTweet);
        testTweet.entities.hashtags.push(goodHashtag);
        bf.find(testTweet, function (err, res) {
            assert.equal(bracket, res);
            done();
        });
    });

    it('should not return a bracket from a bad tweet', function (done) {
        var testTweet = _cloneDeep(fullTweet);
        bf.find({text: 'Test', entities: {urls: [], hashtags: []}}, function (err, res) {
            assert.equal(null, res);
            assert.equal(true, err instanceof Error);
            assert.equal(err.message, 'No bracket in tweet');
            done();
        });
    });

    it('should not a validate bracket if bracket is incomplete', function (done) {
        var testTweet = _cloneDeep(fullTweet);
        bf.find({text: generatedBracket.constants.EMPTY, entities: {urls: [], hashtags: []}}, function (err, res) {
            assert.equal(null, res);
            assert.equal(true, err instanceof Error);
            assert.equal(err.message, 'Bracket has unpicked matches');
            done();
        });
    });

    it('should return a valid bracket from a shortened url', function (done) {
        var testTweet = _cloneDeep(fullTweet);
        testTweet.entities.urls.push({expanded_url: shortenedUrl});
        bf.find(testTweet, function (err, res) {
            assert.equal(null, err);
            assert.equal(bracket, res);
            done();
        });
    });

    it('should not return a bracket from a bad tweet', function (done) {
        var testTweet = _cloneDeep(fullTweet);
        bf.find(testTweet, function (err, res) {
            assert.equal(null, res);
            assert.equal(true, err instanceof Error);
            assert.equal(err.message, 'No bracket in tweet');
            done();
        });
    });

});
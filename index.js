'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const striptags = require('striptags');

const restService = express();
restService.use(bodyParser.json());

const GET_PASSAGE = 'get_passage';
const SEARCH_KEYWORD = 'search_keyword';
const BOOK_ARGUMENT = 'Book';
const CHAPTER_ARGUMENT = 'Chapter';
const START_VERSE_ARGUMENT = 'StartVerse';
const END_VERSE_ARGUMENT = 'EndVerse';
const KEYWORD_ARGUMENT = 'Keyword';
const API_KEY = 'c1QoJ6WPjJGycevbco8vJcWrnQdAxO5n3bUN04jN';

restService.post('/hook', function (req, res) {

    console.log('hook request');

    try {
        var speech = 'empty speech';

        if (req.body) {
            var requestBody = req.body;

            console.log("RequestBody: " + JSON.stringify(requestBody));
            if (requestBody.result) {
                speech = '';

                if (requestBody.result.fulfillment) {
                    speech += requestBody.result.fulfillment.speech;
                    speech += ' ';
                }

                if (requestBody.result.action == GET_PASSAGE) {
                    var baseurl = "https://bibles.org/v2/passages.js?q[]=";
                    var query = makeQueryGetPassage(requestBody.result);

                    var url = baseurl + query;
                    var auth = new Buffer(API_KEY + ':' + 'X').toString('base64');
                    request({
                        url: url,
                        headers: {
                            'Authorization': 'Basic ' + auth
                        },
                        method: 'GET'
                    }, function (error, response, body) {
                        if (error) {
                            console.log('Error sending message: ', error);
                        } else if (response.body.error) {
                            console.log('Error: ', response.body.error);
                        }

                        console.log("SUCCESS: ");
                        console.log("+++++++++++++++++++++++++++");
                        var obj = JSON.parse(body);
                        var text;
                        try {
                            text = obj.response["search"].result.passages[0]["text"];
                            console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                            var strippedText = striptags(text);
                            console.log("STRIPPED TEXT: " + strippedText);

                            return res.json({
                                speech: "Here is the passage you searched for.",
                                displayText: strippedText,
                                source: 'apiai-devotion'
                            });
                        } catch (err) {
                            console.error("ERROR == > ", err);
                            return res.json({
                                speech: "Sorry, cannot not find the given passage.",
                                displayText: "Sorry, cannot not find the given passage.",
                                source: 'apiai-devotion'
                            });
                        }
                    });
                } else if (requestBody.result.action == SEARCH_KEYWORD) {
                    var baseurl = "https://bibles.org/v2/search.js?query=";
                    var query = makeQueryKeywordSearch(requestBody.result);

                    var url = baseurl + query;
                    var auth = new Buffer(API_KEY + ':' + 'X').toString('base64');
                    request({
                        url: url,
                        headers: {
                            'Authorization': 'Basic ' + auth
                        },
                        method: 'GET'
                    }, function (error, response, body) {
                        if (error) {
                            console.log('Error sending message: ', error);
                        } else if (response.body.error) {
                            console.log('Error: ', response.body.error);
                        }

                        console.log("SUCCESS GETTING RESULTS FROM KEYWORD SEARCH: ");
                        console.log("+++++++++++++++++++++++++++");
                        var obj = JSON.parse(body);
                        var text;
                        try {
                            var resultVerses = obj.response["search"].result.verses;
                            var resultToDisplay = "";

                            console.log("======== DEBUG ========");
                            console.log("obj.response[\"search\"].result : " +  obj.response["search"].result);
                            console.log("-------------------------------");
                            console.log("JSON.stringify(obj.response[\"search\"].result) : " + JSON.stringify(obj.response["search"].result));
                            console.log("-------------------------------");
                            console.log("obj.response[\"search\"].result.verses : " + obj.response["search"].result.verses);
                            console.log("-------------------------------");
                            console.log("obj.response[\"search\"].result[0] : " + obj.response["search"].result[0]);
                            console.log("-------------------------------");
                            console.log("obj.response[\"search\"].result[\"verses\"] : " + obj.response["search"].result["verses"]);

                            resultVerses.forEach(function(verse) {
                                console.log("verse ==> " + verse);
                                console.log("verse.reference ==> " + verse.reference);
                                console.log("verse.text ==> " + verse.text);
                                
                                text = verse.text;
                                console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");
                                var strippedText = striptags(text);
                                console.log("STRIPPED TEXT: " + strippedText);

                                resultToDisplay += verse.reference + " \n\n" + strippedText + "\n\n";
                            });

                            return res.json({
                                speech: "Here are the results of your search: ",
                                displayText: strippedText,
                                source: 'apiai-devotion'
                            });
                        } catch (err) {
                            console.error("ERROR == > ", err);
                            return res.json({
                                speech: "Sorry, cannot not find the given passage.",
                                displayText: "Sorry, cannot not find the given passage.",
                                source: 'apiai-devotion'
                            });
                        }
                    });
                }
            }
        }

        console.log('result: ', speech);

        return null;
    } catch (err) {
        console.error("Can't process request", err);

        return res.status(400).json({
            status: {
                code: 400,
                errorType: err.message
            }
        });
    }
});

function makeQueryGetPassage(result) {
    var parameters = result.parameters;
    var book = parameters[BOOK_ARGUMENT];
    if (!book) {
        return None;
    }

    var chapter = parameters[CHAPTER_ARGUMENT];
    if (!chapter) {
        return None;
    }

    var start_verse = parameters[START_VERSE_ARGUMENT];
    if (!start_verse) {
        start_verse = "1"
    } 
    
    var end_verse = parameters[END_VERSE_ARGUMENT];
    if (!end_verse){
        end_verse = "ff"
    }

    return book + "+" + chapter + ":" + start_verse + "-" + end_verse + "&version=eng-KJVA"
}

function makeQueryKeywordSearch(result) {
    var parameters = result.parameters;
    var keyword = parameters[KEYWORD_ARGUMENT];
    if (!keyword) {
        return None;
    }

    return keyword;
}
    

restService.listen((process.env.PORT || 5000), function () {
    console.log("Server listening");
});
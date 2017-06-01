'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');

const restService = express();
restService.use(bodyParser.json());

const SHOW_PASSAGE = 'showing_passage';
const BOOK_ARGUMENT = 'Book';
const CHAPTER_ARGUMENT = 'Chapter';
const START_VERSE_ARGUMENT = 'StartVerse';
const END_VERSE_ARGUMENT = 'EndVerse';

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

                // if (requestBody.result.action) {
                //     speech += 'action: ' + requestBody.result.action;
                // }
                if (requestBody.result.action == SHOW_PASSAGE) {
                    var baseurl = "https://bibles.org/v2/passages.js?q[]=";
                    var query = makeQuery(requestBody.result);

                    var url = baseurl + query;

                    request({
                        url: url,
                        qs: {access_token: 'c1QoJ6WPjJGycevbco8vJcWrnQdAxO5n3bUN04jN'},
                        method: 'GET'
                    }, function (error, response) {
                        if (error) {
                            console.log('Error sending message: ', error);
                        } else if (response.body.error) {
                            console.log('Error: ', response.body.error);
                        }

                        console.log("SUCCESS: " + JSON.stringify(response));
                    });
                }
            }
        }

        console.log('result: ', speech);

        return res.json({
            speech: speech,
            displayText: speech,
            source: 'apiai-webhook-sample'
        });
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

function makeQuery(result) {
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
        end_verse = "-ff"
    }

    return book + "+" + chapter + ":" + start_verse + end_verse + "&version=eng-GNTD"
}
    

restService.listen((process.env.PORT || 5000), function () {
    console.log("Server listening");
});
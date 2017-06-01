'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const striptags = require('striptags');

const restService = express();
restService.use(bodyParser.json());

const GET_PASSAGE = 'get_passage';
const BOOK_ARGUMENT = 'Book';
const CHAPTER_ARGUMENT = 'Chapter';
const START_VERSE_ARGUMENT = 'StartVerse';
const END_VERSE_ARGUMENT = 'EndVerse';

process.env.DEBUG = 'actions-on-google:*';
const App = require('actions-on-google').ApiAiApp;

restService.post('/hook', function (req, res) {

    console.log('hook request');
    const app = new App({req, res});
    console.log('Request headers: ' + JSON.stringify(req.headers));
    console.log('Request body: ' + JSON.stringify(req.body));

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
                if (requestBody.result.action == GET_PASSAGE) {
                    
                }
            }
        }

        console.log('result: ', speech);

        //return null;
        // Make a silly name
        function getPassage (app) {
            var baseurl = "https://bibles.org/v2/passages.js?q[]=";
            var query = makeQuery(app);

            var url = baseurl + query;
            var auth = new Buffer('c1QoJ6WPjJGycevbco8vJcWrnQdAxO5n3bUN04jN' + ':' + 'X').toString('base64');
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
                var text = obj.response["search"].result.passages[0]["text"];

                console.log(text);
                console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~");

                var strippedText = striptags(text);
                console.log(strippedText);
                app.tell('Here is the passage: ' + strippedText);
            });
            
        }

        let actionMap = new Map();
        actionMap.set(GET_PASSAGE, getPassage);

        app.handleRequest(actionMap);


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

function makeQuery(app) {
    var book = app.getArgument(BOOK_ARGUMENT);
    if (!book) {
        return None;
    }

    var chapter = app.getArgument(CHAPTER_ARGUMENT);
    if (!chapter) {
        return None;
    }

    var start_verse = app.getArgument(START_VERSE_ARGUMENT);
    if (!start_verse) {
        start_verse = "1"
    } 
    
    var end_verse = app.getArgument(END_VERSE_ARGUMENT);
    if (!end_verse){
        end_verse = "-ff"
    }

    return book + "+" + chapter + ":" + start_verse + end_verse + "&version=eng-GNTD"
}
    

restService.listen((process.env.PORT || 5000), function () {
    console.log("Server listening");
});
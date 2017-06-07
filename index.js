// init project
const express = require('express');
const ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const Map = require('es6-map');
const striptags = require('striptags');

// Pretty JSON output for logs
const prettyjson = require('prettyjson');

app.use(bodyParser.json({type: 'application/json'}));

// This boilerplate uses Express, but feel free to use whatever libs or frameworks
// you'd like through `package.json`.

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// Uncomment the below function to check the authenticity of the API.AI requests.
// See https://docs.api.ai/docs/webhook#section-authentication
/*app.post('/', function(req, res, next) {
  // Instantiate a new API.AI assistant object.
  const assistant = new ApiAiAssistant({request: req, response: res});
  
  // Throw an error if the request is not valid.
  if(assistant.isRequestFromApiAi(process.env.API_AI_SECRET_HEADER_KEY, 
                                  process.env.API_AI_SECRET_HEADER_VALUE)) {
    next();
  } else {
    console.log('Request failed validation - req.headers:', JSON.stringify(req.headers, null, 2));
    
    res.status(400).send('Invalid request');
  }
});*/

// Handle webhook requests
app.post('/', function(req, res, next) {
  // Log the request headers and body, to aide in debugging. You'll be able to view the
  // webhook requests coming from API.AI by clicking the Logs button the sidebar.
  logObject('Request headers: ', req.headers);
  logObject('Request body: ', req.body);
    
  // Instantiate a new API.AI assistant object.
  const assistant = new ApiAiAssistant({request: req, response: res});

  // Declare constants for your action and parameter names
    const GET_PASSAGE = 'get_passage';
    const SEARCH_KEYWORD = 'search_keyword';
    const BOOK_ARGUMENT = 'Book';
    const CHAPTER_ARGUMENT = 'Chapter';
    const START_VERSE_ARGUMENT = 'StartVerse';
    const END_VERSE_ARGUMENT = 'EndVerse';
    const KEYWORD_ARGUMENT = 'Keyword';
    const API_KEY = 'c1QoJ6WPjJGycevbco8vJcWrnQdAxO5n3bUN04jN';

    const ASK_WEATHER_ACTION = 'askWeather';  // The action name from the API.AI intent
    const CITY_PARAMETER = 'geo-city'; // An API.ai parameter name

    function makeQueryGetPassage(app) {
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
            end_verse = "ff"
        }

        return book + "+" + chapter + ":" + start_verse + "-" + end_verse + "&version=eng-KJVA"
    }

  // Create functions to handle intents here
  function getPassage(assistant) {
    console.log('Handling action: ' + GET_PASSAGE);

    var baseurl = "https://bibles.org/v2/passages.js?q[]=";
    // app.tell('Here is the passage you are looking for : ');
    var query = makeQueryGetPassage(assistant);

    var url = baseurl + query;
    console.log("URL : " + url);

    var auth = new Buffer('c1QoJ6WPjJGycevbco8vJcWrnQdAxO5n3bUN04jN' + ':' + 'X').toString('base64');
    request({
        url: url,
        headers: {
            'Authorization': 'Basic ' + auth
        },
        method: 'GET'
    }, function (error, response) {
        if(error) {
            console.log('Error sending message: ', error);
            next(error);
        } else {        
            console.log("SUCCESS: ");
            let obj = JSON.parse(response.body);
            logObject('API call response ==> ', obj);
            var text = obj.response["search"].result.passages[0]["text"];

            var strippedText = striptags(text);
            console.log(strippedText);

            assistant.tell('Here is the passage:  ' + strippedText);
        }
    });
  }
  
  // Add handler functions to the action router.
  let actionRouter = new Map();

  actionRouter.set(GET_PASSAGE, getPassage);
  
  // Route requests to the proper handler functions via the action router.
  assistant.handleRequest(actionRouter);
});

// Handle errors.
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

// Pretty print objects for logging.
function logObject(message, object, options) {
  console.log(message);
  console.log(prettyjson.render(object, options));
}

// Listen for requests.
let server = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + server.address().port);
});
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
//   logObject('Request headers: ', req.headers);
//   logObject('Request body: ', req.body);
    
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
         
        var end_verse = app.getArgument(END_VERSE_ARGUMENT);
        if (!end_verse){
            if (!start_verse) {
                end_verse = "-ff";
            } else {
                end_verse = "";
            }
        } else {
            end_verse = "-" + end_verse;
        }

        if (!start_verse) {
            start_verse = "1"
        }

        return {
            passage: book + "+" + chapter + ":" + start_verse + end_verse + "&version=eng-KJVA",
            book: book,
            chapter: chapter,
            start_verse: start_verse,
            end_verse: end_verse
        }
    }

    // Create functions to handle intents here
    function getPassage(assistant) {
        console.log('Handling action: ' + GET_PASSAGE);

        var baseurl = "https://bibles.org/v2/passages.js?q[]=";
        // app.tell('Here is the passage you are looking for : ');
        var query = makeQueryGetPassage(assistant);

        var url = baseurl + query.passage;
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
                // logObject('API call response ==> ', obj);
                var text = obj.response["search"].result.passages[0]["text"];

                var strippedText = striptags(text);
                
                console.log(strippedText);
                if (assistant.hasSurfaceCapability(assistant.SurfaceCapabilities.SCREEN_OUTPUT)) {
                    assistant.ask(assistant.buildRichResponse()
                        // Create a basic card and add it to the rich response
                        .addSimpleResponse('Here is the passage you are looking for')
                        .addBasicCard(assistant.buildBasicCard(strippedText)
                            .setTitle(query.book + " Chapter " + query.chapter + ":" + query.start_verse + query.end_verse)
                            .addButton('Read more')
                        )
                    );
                } else {
                    assistant.tell('Here is the passage:  ' + strippedText);
                }
            }
        });
    }

    function makeQueryKeywordSearch(app) {
        var keyword = app.getArgument(KEYWORD_ARGUMENT);
        if (!keyword) {
            return None;
        }
        return keyword;
    }

    function keywordSearch(assistant) {
        var baseurl = "https://bibles.org/v2/search.js?query=";
        var query = makeQueryKeywordSearch(assistant);
        var url = baseurl + query + "&version=eng-KJVA";
        var auth = new Buffer(API_KEY + ':' + 'X').toString('base64');
        console.log("URL: " + url);
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
                console.log("SUCCESS GETTING RESULTS FROM KEYWORD SEARCH: ");
                console.log("+++++++++++++++++++++++++++");
                var obj = JSON.parse(response.body);
                var text;
                try {
                    var resultVerses = obj.response["search"].result.verses;
                    var resultToDisplay = "";

                    console.log("======== DEBUG ========");

                    // Build a list
                    var list = assistant.buildList('Here are some search results for ' + query);
                    var position = 0;
                    resultVerses.forEach(function(verse) {
                        
                        text = verse.text;
                        
                        var strippedText = striptags(text);
                        console.log("STRIPPED TEXT: " + strippedText);
                        console.log("verse reference : " + verse.reference);
                        // resultToDisplay += verse.reference + " \n\n" + strippedText + "\n\n";

                        // Add the item to the list
                        list.addItems(assistant.buildOptionItem(position,[])
                        .setTitle(verse.reference)
                        .setDescription(strippedText));

                        position++;
                        
                    });

                    assistant.askWithList(assistant.buildRichResponse()
                        .addSimpleResponse('Here is the results: ')
                        .addSuggestions(
                        ['Basic Card', 'List', 'Carousel', 'Suggestions']),list
                    );

                    console.log("DONE");
                    assistant.ask("What else can I do for you? ");
                } catch (err) {
                    console.error("ERROR == > ", err);
                    assistant.tell('Sorry, cannot not find the given passage.');
                }
            }
        });

    }

    function itemSelected (app) {
        // Get the user's selection
        const param = app.getContextArgument('actions_intent_option',
            'OPTION').value;

        console.log(" PARAM : " + param);

        // // Compare the user's selections to each of the item's keys
        // if (!param) {
        //     app.ask('You did not select any item from the list');
        // } else if (param === 'MATH_AND_PRIME') {
        //     app.ask('42 is an abundant number because the sum of its…');
        // } else if (param === 'EGYPT') {
        //     app.ask('42 gods who ruled on the fate of the dead in the ');
        // } else if (param === 'RECIPES') {
        //     app.ask('Here\'s a beautifully simple recipe that\'s full ');
        // } else {
        //     app.ask('You selected an unknown item from the list or carousel');
        // }
    }

    // Add handler functions to the action router.
    let actionRouter = new Map();

    actionRouter.set(GET_PASSAGE, getPassage);
    actionRouter.set(SEARCH_KEYWORD, keywordSearch);

    // Route requests to the proper handler functions via the action router.
    assistant.handleRequest(actionRouter);
});

// Handle errors.
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

// Pretty print objects for logging.
// function logObject(message, object, options) {
//   console.log(message);
//   console.log(prettyjson.render(object, options));
// }

// Listen for requests.
let server = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + server.address().port);
});
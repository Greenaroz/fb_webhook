'use strict';


const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

// Imports dependencies and set up http server
const
  request = require('request'),
  express = require('express'),
  bodyParser = require('body-parser'),
  app = express().use(bodyParser.json()); // creates express http server

// Sets server port and logs message on success
app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));

// Creates the endpoint for our webhook
app.post('/webhook', (req, res) => {

  let body = req.body;
  console.log('BODY = ' + JSON.stringify(body));


  let webhook_event;
  // Checks this is an event from a page subscription
  if (body.object === 'page') {

    // Iterates over each entry - there may be multiple if batched
    body.entry.forEach(function(entry) {

      // Gets the message. entry.messaging is an array, but
      // will only ever contain one message, so we get index 0
      if(entry.changes) {
        let change = entry.changes[0];

        if(change.field && change.field === 'feed' && change.value.item === 'comment') {
          let sender_id =  change.value.comment_id;
          console.log('COMMENT ID = ' + sender_id);
          replyToCommentSimple(change.value.comment_id);
        }
      }
      else if (entry.messaging) {
        webhook_event = entry.messaging[0];
        console.log(JSON.stringify(entry.messaging[0]));
      }


    });

    // Returns a '200 OK' response to all requests
    res.status(200).send('EVENT_RECEIVED');
  } else {
    // Returns a '404 Not Found' if event is not from a page subscription
    res.sendStatus(404);
  }

});


// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.
  let VERIFY_TOKEN = "aromal";

  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];

  // Checks if a token and mode is in the query string of the request
  if (mode && token) {

    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {

      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);

    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);
    }
  }
});


function replyToCommentHybrid(post_comment_id){

  let response = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "generic",
        "elements": [{
          "title": "Generic Template Testing",
          "subtitle": "Do you want to keep in touch?",
          "image_url": "https://wallpaperbrowse.com/media/images/cool-pictures-24.jpg",
          "buttons": [
            {
              "type": "postback",
              "title": "Contact Me",
              "payload": "yes",
            },
            {
              "type": "postback",
              "title": "No means No!",
              "payload": "no",
            }
          ],
        }]
      }
    }
  }

  replyToComment(post_comment_id, response);
}

function replyToCommentSimple(post_comment_id){

  let response = 'Simple text response to a comment on my post';

  replyToComment(post_comment_id, response);
}

function replyToComment(post_comment_id, response){

  let request_body = {
    "message": response
  }

  console.log('POST COMMENT ID = ' + post_comment_id);
  console.log('RESPONSE = ' + JSON.stringify(response));

  let uri = 'https://graph.facebook.com/v2.9/' + post_comment_id+ '/private_replies';
  console.log('URI = ' + uri);
  console.log('PAGE ACCESS TOKEN  = ' + PAGE_ACCESS_TOKEN);



    // Send the HTTP request to the Messenger Platform
  request({
    "uri": uri,
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!');
      console.log('response ' + JSON.stringify(res));
      console.log('body ' + JSON.stringify(body));
    } else {
      console.error("Unable to send message:" + err);
    }
  });

}

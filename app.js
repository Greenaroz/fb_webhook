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
  console.log(body);

  // Checks this is an event from a page subscription
  if (body.object === 'page') {

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


// Handles messages events
function handleMessage(sender_psid, received_message) {
  let response;

    // Check if the message contains text
    if (received_message.text) {
      // Create the payload for a basic text message
      response = {
        "text": `Text message: "${received_message.text}". Wanna try an image?`
      }
    } else if (received_message.attachments) {

        // Get the URL of the message attachment
         let attachment_url = received_message.attachments[0].payload.url;
         response = {
           "attachment": {
             "type": "template",
             "payload": {
               "template_type": "generic",
               "elements": [{
                 "title": "Generic Template Testing",
                 "subtitle": "Do you want to keep in touch?",
                 "image_url": attachment_url,
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
    }

    // Sends the response message
    callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
function handlePostback(sender_psid, received_postback) {

let response;

 // Get the payload for the postback
 let payload = received_postback.payload;

 // Set the response based on the postback payload
 if (payload === 'yes') {
   response = { "text": "Cool. Added you to our contact list!" }
 } else if (payload === 'no') {
   response = { "text": "Oh well. Your loss." }
 }
 // Send the message to acknowledge the postback
 callSendAPI(sender_psid, response);

}

// Sends response messages via the Send API
function callSendAPI(sender_psid, response) {
  // Construct the message body
    let request_body = {
      "recipient": {
        "id": sender_psid
      },
      "message": response
    }

    // Send the HTTP request to the Messenger Platform
  request({
    "uri": "https://graph.facebook.com/v2.6/me/messages",
    "qs": { "access_token": PAGE_ACCESS_TOKEN },
    "method": "POST",
    "json": request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('message sent!')
    } else {
      console.error("Unable to send message:" + err);
    }
  });

}
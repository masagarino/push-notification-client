// Pull in dependencies
const express = require('express');
const webPush = require('web-push');
const bodyParser = require('body-parser');
const _ = require('lodash');

// Server settings with ExpressJS
const app = express();
const port = process.env.PORT || 3000;
const runningMessage = 'Server is running on port ' + port;

// Set up custom dependencies
// Constants just contains common messages so they're in one place
const constants = require('./constants');
let vapidKeys = {
  publicKey: "BCwShOm6SPGJ2SX6zQNLR1peM26ddlEfmzT_LW-2Ckz5OINYD-6aXy8S5y0HAX7XF9vd8riP5ZYCoqULR5-c1Gs",
  privateKey: "J_Rx_Hdv4iaWmkUryrgIZZT83HXEpjwLbcqb2UoB7Cg"
};

webPush.setVapidDetails(
  'mailto:email@domain.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

let subscriptions = [];

app.use(bodyParser.json());

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept'
  );
  return next();
});

app.post('/subscribe', (req, res) => {
  const body = JSON.stringify(req.body);
  let sendMessage;
  console.log(body)
  if (_.includes(subscriptions, body)) {
      sendMessage = constants.messages.SUBSCRIPTION_ALREADY_STORED;
  } else {
      subscriptions.push(body);

      sendMessage = constants.messages.SUBSCRIPTION_STORED;
  }
  res.send(sendMessage);
});
app.post('/push', (req, res, next) => {
  const pushSubscription = req.body.pushSubscription;
  const notificationMessage = req.body.notificationMessage;
  console.log(pushSubscription,notificationMessage );
  if (!pushSubscription) {
      res.status(400).send(constants.errors.ERROR_SUBSCRIPTION_REQUIRED);
      return next(false);
  }

  if (subscriptions.length) {
      subscriptions.map((subscription, index) => {
      let jsonSub = JSON.parse(subscription);

      webPush.sendNotification(jsonSub, notificationMessage)
          .then(success => handleSuccess(success, index))
          .catch(error => handleError(error, index));
      });
  } else {
      res.send(constants.messages.NO_SUBSCRIBERS_MESSAGE);
      return next(false);
  }

  function handleSuccess(success, index) {
      res.send(constants.messages.SINGLE_PUBLISH_SUCCESS_MESSAGE);
      return next(false);    
  }

  function handleError(error, index) {
      res.status(500).send(constants.errors.ERROR_MULTIPLE_PUBLISH);
      return next(false);    
  }
});

app.get('/', (req, res) => {
  res.send(runningMessage);
});

app.listen(port, () => console.log(runningMessage));

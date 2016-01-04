# btrz-sqs [![Circle CI](https://circleci.com/gh/Betterez/btrz-sqs.svg?style=svg)](https://circleci.com/gh/Betterez/btrz-sqs) [![NPM version](https://badge-me.herokuapp.com/api/npm/btrz-sqs.png)](http://badges.enytc.com/for/npm/btrz-sqs)
A simple client to send messages to an AWS SQS queue with a very convenient interface.

It uses native Promises

## Runtimes supported

io.js >= 1.0.3
node v0.11.x with the --harmony flag

## Usage

Add the module to your `package.json` directly or just run

    npm install btrz-sqs --save

Require and use the `Queue` object to create and send messages to a queue.

    let Queue = require("btrz-sqs").Queue;
    let q = new Queue(config, queueName);

    let obj = {text: "An object to send as a message", email: "email@example.com"};

    // This creates a message that SQS will be able to work with.
    let msg = Queue.createMessage("theId", obj);

    // Now we can send the message
    var promise = q.send([msg]);

    // Send returns a Promise so we can work with it normally.
    promise.then(function (result) {
        // Do something with the result
    })
    .catch(function (err) {
        // Do something with the error
    });


### Config object


    config =  {
      key: process.env.AWS_KEY,
      secret: process.env.AWS_SECRET,
      sqs: {
        dataImport: {
          queueUrl: process.env.AWS_SQS_URL,
          region: "us-east-1"
        }
      }
    };


The sqs object in the config can have multiple queues, in the constructor you indicate what queue to use given a string that is the key in the `config.sqs` object. In this case is `dataImport`

    new Queue(config, "dataImport");


#### .createMessage

The static `.createMessage` method takes an id and some object or primitive to use as the message.
Objects will be serialize with `JSON.stringify`

#### .send

The instance `.send` method takes an array of messages to send to the queue.
It returns a native Promise

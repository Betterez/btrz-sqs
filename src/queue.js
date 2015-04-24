"use strict";
let BATCH_SIZE = 10;
let AWS = require("aws-sdk");
let _ = require("lodash");

function entryId(entry) {
  return entry.Id;
}

function createError(failedMessages) {
  if (failedMessages.length === 0) {
    return null;
  }
  return new Error(`Failed to send messages: ${failedMessages.join(", ")}`);
}

function isValidMsg(msg, index) {
  if (msg.Id && msg.MessageBody && msg.Id.indexOf(" ") === -1) {
    return "";
  } else {
    return {index: index, msg: msg};
  }
}

function validateMessages(messages) {
  return messages
    .map(isValidMsg)
      .filter(function (msg) {
        return msg !== "";
      });
}

function recursiveSend(failedMessages, messages, queueUrl, sqs, cb) {
  let params = {
    Entries: messages.splice(0, BATCH_SIZE),
    QueueUrl: queueUrl
  };

  if (params.Entries.length > 0) {
    sqs.sendMessageBatch(params, function (err, result) {
      if (err) {
        return cb(err);
      }
      failedMessages = failedMessages.concat(result.Failed.map(entryId));
      recursiveSend(failedMessages, messages, queueUrl, sqs, cb);
    });
  } else {
      return cb(null, failedMessages);
  }
}

function Queue(config, queueName) {

  this.awsConfig = config;
  this.queueConfig = config.sqs[queueName];
  this.sqs = new AWS.SQS({
      accessKeyId: this.awsConfig.key,
      secretAccessKey: this.awsConfig.secret,
      region: this.queueConfig.region
    });
}

Queue.prototype.send = function(messages) {
  let self = this;

  if (!Array.isArray(messages)) {
    throw new Error("messages should be an array of Queue.messages");
  }

  let invalidMsgs = validateMessages(messages);
  if (invalidMsgs.length > 0) {
    let indexes = _.pluck(invalidMsgs, "index").join(", ");
    throw new Error(`invalid messages at indexes ${indexes}`);
  }
  function resolver(resolve, reject) {

    recursiveSend([], messages, self.queueConfig.queueUrl, self.sqs, function (err, failures) {
      if (err) {
        return reject(err);
      }
      if (failures.length > 0) {
        reject(createError(failures));
      } else {
        resolve(true);
      }
    });
  }
  return new Promise(resolver);
};

Queue.createMessage = function (id, message) {
  return {
    Id: id.toString(),
    MessageBody: JSON.stringify(message)
  };
};

exports.Queue = Queue;
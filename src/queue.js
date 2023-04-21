"use strict";
const BATCH_SIZE = 10;
const AWS = require("@aws-sdk/client-sqs");

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

async function recursiveSend(failedMessages, messages, queueUrl, sqs) {
  let params = {
    Entries: messages.splice(0, BATCH_SIZE),
    QueueUrl: queueUrl
  };
  if (params.Entries.length > 0) {
    try {
      const result = await sqs.sendMessageBatch(params);
      failedMessages = failedMessages.concat((result.Failed || []).map(entryId));
      recursiveSend(failedMessages, messages, queueUrl, sqs);
    } catch(err) {
      throw err;
    }
  } else {
    return Promise.resolve(failedMessages);
  }
}

function Queue(config, queueName) {
  this.awsConfig = config;
  this.queueConfig = config.sqs[queueName];
  this.sqs = new AWS.SQS({
      credentials: {
        accessKeyId: this.awsConfig.key,
        secretAccessKey: this.awsConfig.secret,
      },
      region: this.queueConfig.region
    });
}

Queue.prototype.get = function () {
  let self = this;
  return self.sqs.receiveMessage({ QueueUrl: self.queueConfig.queueUrl });
};

Queue.prototype.send = function(messages) {
  let self = this;
  let failures = [];

  if (!Array.isArray(messages)) {
    throw new Error("messages should be an array of Queue.messages");
  }

  let invalidMsgs = validateMessages(messages);
  if (invalidMsgs.length > 0) {
    let indexes = invalidMsgs.map((m) => m.index).join(", ");
    throw new Error(`invalid messages at indexes ${indexes}`);
  }

  try {
    failures = recursiveSend([], messages, self.queueConfig.queueUrl, self.sqs);
  } catch (err) {
    return Promise.reject(err);
  }

  if (failures.length > 0) {
    return Promise.reject(createError(failures));
  }
  return Promise.resolve(true);
};

Queue.createMessage = function (id, message) {
  return {
    Id: id.toString(),
    MessageBody: JSON.stringify(message)
  };
};

exports.Queue = Queue;
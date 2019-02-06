"use strict";

describe("Queue", function () {

  let Queue = require("../src/queue").Queue,
    expect = require("chai").expect,
    Chance = require("chance").Chance,
    chance = new Chance(),
    _ = require("lodash"),
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

  let queue;
  beforeEach(function () {
    queue = new Queue(config, "dataImport");
  });

  describe("createMessage(id, message)", function () {
    it ("should serialize objects for the body", function () {
      let obj = {name: chance.word(), email: chance.email()};
      let msg = Queue.createMessage("id", obj);
      expect(msg.MessageBody).to.be.eql(JSON.stringify(obj));
    });
  });

  describe("send([])", function () {

    it("should send a message", function (done) {
      if (config.key) {
        let msg = Queue.createMessage("amsg", "a message body");
        queue.send([msg]).then(function (result) {
          expect(result).to.be.true;
          done();
        });
      } else {
        done();
      }
    });

    it("should throw if messages is not an array", function () {
      function sut() {
        queue.send("");
      }
      expect(sut).to.throw("messages should be an array of Queue.messages");
    });

    it("should throw if any of the messages is not a valid message", function () {
      function sut() {
        let msg = Queue.createMessage("id", "content");
        queue.send([msg, "invalid msg"]);
      }
      expect(sut).to.throw("invalid messages at indexes 1");
    });

    it("should throw if any message id is invalid", function () {
      function sut() {
        let msg = Queue.createMessage("id", "content");
        let invalid = Queue.createMessage("id", "content");
        invalid.Id = "invalid id";
        queue.send([msg, "invalid msg", msg, invalid]);
      }
      expect(sut).to.throw("invalid messages at indexes 1, 3");
    });

    it("should processed more than 10 messages (SQS limit)", function (done) {

      let messages = _.range(25).map(function (id) {
        return Queue.createMessage(id, `content for ${id}`);
      });

      if (config.key) {
        queue.send(messages).then(function (result) {
          expect(result).to.be.true;
          done();
        }, function (err) {
          done(err);
        });
      } else {
        done();
      }
    });
  });
});
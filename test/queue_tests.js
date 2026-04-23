const {beforeEach, describe, it} = require("node:test");
const assert = require("node:assert/strict");
const {Queue} = require("../src/queue");

describe("Queue", function () {
  let config =  {
      key: process.env.AWS_KEY,
      secret: process.env.AWS_SECRET,
      sqs: {
        dataImport: {
          queueUrl: process.env.AWS_SQS_URL,
          region: "us-east-1"
        }
      }
    };

  function createRange(size) {
    return Array.from({length: size}, function (_, index) {
      return index;
    });
  }

  let queue;
  beforeEach(function () {
    queue = new Queue(config, "dataImport");
  });

  describe("createMessage(id, message)", function () {
    it ("should serialize objects for the body", function () {
      let obj = {name: "hjkhasdASFDASD123", email: "hjkhasdASFDASD123@example.com"};
      let msg = Queue.createMessage("id", obj);
      assert.deepStrictEqual(msg.MessageBody, JSON.stringify(obj));
    });
  });

  describe("send([])", function () {

    it("should send a message", async function () {
      if (config.key) {
        let msg = Queue.createMessage("amsg", "a message body");
        const result = await queue.send([msg]);
        assert.strictEqual(result, true);
      }
    });

    it("should throw if messages is not an array", function () {
      function sut() {
        queue.send("");
      }
      assert.throws(sut, new Error("messages should be an array of Queue.messages"));
    });

    it("should throw if any of the messages is not a valid message", function () {
      function sut() {
        let msg = Queue.createMessage("id", "content");
        queue.send([msg, "invalid msg"]);
      }
      assert.throws(sut, new Error("invalid messages at indexes 1"));
    });

    it("should throw if any message id is invalid", function () {
      function sut() {
        let msg = Queue.createMessage("id", "content");
        let invalid = Queue.createMessage("id", "content");
        invalid.Id = "invalid id";
        queue.send([msg, "invalid msg", msg, invalid]);
      }
      assert.throws(sut, new Error("invalid messages at indexes 1, 3"));
    });

    it("should process more than 10 messages (SQS limit)", async function () {

      let messages = createRange(25).map(function (id) {
        return Queue.createMessage(id, `content for ${id}`);
      });

      if (config.key) {
        const result = await queue.send(messages);
        assert.strictEqual(result, true);
      }
    });

    it("should read messages", async () => {
      if (config.key) {
        let msg = Queue.createMessage("amsg", "a message body");
        await queue.send([msg]);
        const receive = await queue.get();
        assert.deepStrictEqual(receive.Messages.length, 1);
        return receive;
      } else {
        return Promise.resolve();
      }
    });
  });
});
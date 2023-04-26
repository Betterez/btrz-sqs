describe("Worker", function () {
  let SQSWorker = require("../index.js").SQSWorker;
  let Queue = require("../index.js").Queue;
  const expect = require("chai").expect;
  const Chance = require("chance").Chance;
  const chance = new Chance();
  const _ = require("lodash");
  const options = {
    url: process.env.AWS_SQS_URL,
    region: "us-east-1",
    accessKeyId: process.env.AWS_KEY,
    secretAccessKey: process.env.AWS_SECRET,
    timeout: 90 * 60
  };
  const config =  {
    key: process.env.AWS_KEY,
    secret: process.env.AWS_SECRET,
    sqs: {
      importData: {
        queueUrl: process.env.AWS_SQS_URL,
        region: "us-east-1"
      }
    }
  };


  //use for integration only
  describe.skip("SQSWorker and worker invoker", function () {
    it("should listen for messages", async function () {
      let queue = new Queue(config, "importData");
      if (config.key) {
        let msg = Queue.createMessage("amsg", "a message body");
        await queue.send([msg]);
      }
      function workerInvoker() { 
        return (message, _done) => {
          console.log("worker invoked with message", message);
          _done(null, true);
        };
      }
      const worker = new SQSWorker(options, workerInvoker());
    });
  });
});
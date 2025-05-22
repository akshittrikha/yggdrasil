const { MongoClient } = require('mongodb');
const AWS = require('aws-sdk');

class MongoDBOutboxSQS {
  constructor(config) {
    this.mongoUri = config.mongoUri;
    this.dbName = config.dbName;
    this.outboxCollection = config.outboxCollection || 'outbox';
    this.sqsConfig = {
      region: config.awsRegion || 'ap-southeast-1',
      accessKeyId: config.awsAccessKeyId,
      secretAccessKey: config.awsSecretAccessKey,
      queueUrl: config.sqsQueueUrl,
    };

    this.sqs = new AWS.SQS(this.sqsConfig);
    this.client = null;
    this.db = null;
  }

  async connect() {
    if (!this.client) {
      this.client = new MongoClient(this.mongoUri);
      await this.client.connect();
      this.db = this.client.db(this.dbName);
    }
    return this.db;
  }

  async close() {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
    }
  }

  /**
   * Execute a transaction with the outbox pattern
   * @param {string} collectionName - The target collection name
   * @param {Function} operation - Function that takes a collection and performs the operation
   * @param {Object} eventPayload - The event payload to be sent to SQS
   * @param {string} eventType - The type of event
   * @returns {Object} - Result of the transaction
   */

  async executeWithOutbox(collectionName, operation, eventPayload, eventType) {
    const db = await this.connect();
    const session = this.client.startSession();

    try {
      let result;

      await session.withTransaction(async () => {
        // 1. Perform the main operation on the target collection
        const collection = db.collection(collectionName);
        console.log(`[ob] collection: ${collection}`);
        result = await operation(collection, session);

        // 2. Insert into outbox collection
        const outboxCollection = db.collection(this.outboxCollection);
        const outboxDocument = {
          eventType,
          payload: eventPayload,
          status: 'PENDING',
          createdAt: new Date(),
        };

        await outboxCollection.insertOne(outboxDocument, { session });
      });

      // 3. After transaction is committed, process the outbox
      await this.processOutbox();

      return result;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    } finally {
      await session.endSession();
    }
  }

  async processOutbox() {
    const db = await this.connect();
    const outboxCollection = db.collection(this.outboxCollection);
    
    // Find all pending outbox messages
    const pendingMessages = await outboxCollection.find({ status: 'PENDING' }).toArray();
    for (const message of pendingMessages) {
      try {
        // send to sqs
        await this.sendToSQS(message.payload);

        // udpate status to PROCESSED
        await outboxCollection.updateOne(
          { _id: message._id },
          { $set: { status: 'PROCESSED', processedAt: new Date() } }
        );
      } catch (error) {
        console.error(`Failed to process outbox message ${message._id}`, error);

        // update status to FAILED
        await outboxCollection.updateOne(
          { _id: message._id },
          {
            $set: {
              status: 'FAILED',
              error: error.message,
              errorAt: new Date(),
            }
          }
        );
      }
    }
  }

  /**
   * Send a message to SQS
   * @param {Object} message - The message to send
   */
  async sendToSQS(message) {
    const params = {
      QueueUrl: this.sqsConfig.queueUrl,
      MessageBody: JSON.stringify({
        id: message._id,
        eventType: message.eventType,
        payload: message.payload,
        result: message.result,
        timestamp: new Date().toISOString(),
      }),
    };

    return new Promise((resolve, reject) => {
      this.sqs.sendMessage(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      })
    })
  }
}

module.exports = { MongoDBOutboxSQS };
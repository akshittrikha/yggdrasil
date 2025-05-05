/**
 * Base class for Outbox pattern implementation
 */
class OutboxBase {
  constructor(config) {
    this.outboxCollection = config.outboxCollection || 'outbox';
    this.sqsConfig = {
      region: config.awsRegion || 'ap-southeast-1',
      accessKeyId: config.awsAccessKeyId,
      secretAccessKey: config.awsSecretAccessKey,
      queueUrl: config.sqsQueueUrl,
    };

    // Initialize AWS SQS
    const AWS = require('aws-sdk');
    this.sqs = new AWS.SQS(this.sqsConfig);
  }

  /**
   * Connect to the database
   * @abstract
   */
  async connect() {
    throw new Error('Method connect() must be implemented by subclass');
  }

  /**
   * Close the database connection
   * @abstract
   */
  async close() {
    throw new Error('Method close() must be implemented by subclass');
  }

  /**
   * Execute a transaction with the outbox pattern
   * @abstract
   * @param {string} tableName - The target table/collection name
   * @param {Function} operation - Function that performs the operation
   * @param {Object} eventPayload - The event payload to be sent to SQS
   * @param {string} eventType - The type of event
   * @returns {Object} - Result of the transaction
   */
  async executeWithOutbox(tableName, operation, eventPayload, eventType) {
    throw new Error('Method executeWithOutbox() must be implemented by subclass');
  }

  /**
   * Process pending outbox messages
   * @abstract
   */
  async processOutbox() {
    throw new Error('Method processOutbox() must be implemented by subclass');
  }

  /**
   * Send a message to SQS
   * @param {Object} message - The message to send
   */
  async sendToSQS(message) {
    const params = {
      QueueUrl: this.sqsConfig.queueUrl,
      MessageBody: JSON.stringify({
        id: message.id || message._id,
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
      });
    });
  }
}

module.exports = OutboxBase;
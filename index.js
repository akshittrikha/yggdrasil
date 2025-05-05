/**
 * Outbox Pattern with SQS integration
 * 
 * A package that implements the Outbox Pattern for MongoDB and PostgreSQL with AWS SQS integration
 * to ensure reliable event publishing in distributed systems.
 */

const MongoDBOutboxSQS = require('./src/mongo');
const PostgresOutboxSQS = require('./src/postgres');

module.exports = {
  MongoDBOutboxSQS,
  PostgresOutboxSQS
};
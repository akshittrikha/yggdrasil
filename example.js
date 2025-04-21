require('dotenv').config(); // Load environment variables from .env file

/**
 * Example usage of the MongoDB Outbox SQS package
 */

const { MongoDBOutboxSQS } = require('./index'); // In your project, use: require('outbox-service');

// Configuration for MongoDB and AWS SQS
const config = {
  mongoUri: process.env.MONGO_URI,
  dbName: process.env.DB_NAME,
  outboxCollection: process.env.OUTBOX_COLLECTION,
  awsRegion: process.env.AWS_REGION,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sqsQueueUrl: process.env.SQS_QUEUE_URL
};

// Initialize the outbox handler
const outboxHandler = new MongoDBOutboxSQS(config);

// Example operation: Create a user
async function createUser(collection, session) {
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
    createdAt: new Date()
  };
  
  const result = await collection.insertOne(user, { session });
  return result;
}

// Example usage
async function main() {
  try {
    // Execute the operation with outbox pattern
    const result = await outboxHandler.executeWithOutbox(
      'loanrequest-outbox-test', // collection name
      createUser, // operation to perform
      { action: 'USER_CREATED', userId: 'example-user-id' }, // event payload
      'USER_CREATION' // event type
    );

    console.log('User created successfully:', result);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the MongoDB connection
    await outboxHandler.close();
  }
}

// Run the example
main();
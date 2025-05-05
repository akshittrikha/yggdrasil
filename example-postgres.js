require('dotenv').config(); // Load environment variables from .env file

/**
 * Example usage of the PostgreSQL Outbox SQS package
 */

const { PostgresOutboxSQS } = require('./index'); // In your project, use: require('outbox-service');

// Configuration for PostgreSQL and AWS SQS
const config = {
  pgHost: process.env.PG_HOST,
  pgPort: process.env.PG_PORT || 5432,
  pgDatabase: process.env.PG_DATABASE,
  pgUser: process.env.PG_USER,
  pgPassword: process.env.PG_PASSWORD,
  pgSsl: process.env.PG_SSL === 'true',
  outboxCollection: process.env.OUTBOX_TABLE || 'outbox',
  awsRegion: process.env.AWS_REGION,
  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  sqsQueueUrl: process.env.SQS_QUEUE_URL
};

// Initialize the outbox handler
const outboxHandler = new PostgresOutboxSQS(config);

// Example operation: Create a user
async function createUser(client, tableName) {
  const user = {
    name: 'John Doe',
    email: 'john@example.com',
    created_at: new Date()
  };
  
  const result = await client.query(
    `INSERT INTO ${tableName} (name, email, created_at) VALUES ($1, $2, $3) RETURNING *`,
    [user.name, user.email, user.created_at]
  );
  
  return result.rows[0];
}

// Example usage
async function main() {
  try {
    // Ensure the outbox table exists
    await outboxHandler.ensureOutboxTable();
    
    // Execute the operation with outbox pattern
    const result = await outboxHandler.executeWithOutbox(
      'users', // table name
      createUser, // operation to perform
      { action: 'USER_CREATED', userId: 'example-user-id' }, // event payload
      'USER_CREATION' // event type
    );

    console.log('User created successfully:', result);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Close the PostgreSQL connection
    await outboxHandler.close();
  }
}

// Run the example
main();
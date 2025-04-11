# MongoDB Outbox Pattern with SQS

A Node.js package that implements the Outbox Pattern for MongoDB with AWS SQS integration. This pattern ensures reliable event publishing in distributed systems by using a transactional outbox.

## Installation

```bash
npm install outbox-service
```

## Features

- Transactional outbox pattern implementation
- MongoDB transaction support
- AWS SQS integration
- Automatic outbox processing
- Error handling and status tracking

## Usage

```javascript
require('dotenv').config(); // Load environment variables from .env file

const { MongoDBOutboxSQS } = require('outbox-service');

// Configuration using environment variables
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
async function createUser(object, collection, session) {
    const result = await collection.insertOne(object, { session });
    return result;
}

// Example usage
async function main() {
    const user = {
        name: 'John Doe',
        email: 'John.Doe@example.com',
        createdAt: new Date()
    };

    try {
        // Execute the operation with outbox pattern
        const result = await outboxHandler.executeWithOutbox(
            'users', // collection name
            user, // data object to be inserted
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
```

## Configuration

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| mongoUri | string | Yes | MongoDB connection string |
| dbName | string | Yes | Database name |
| outboxCollection | string | No | Name of the outbox collection (default: 'outbox') |
| awsRegion | string | Yes | AWS region |
| awsAccessKeyId | string | Yes | AWS access key ID |
| awsSecretAccessKey | string | Yes | AWS secret access key |
| sqsEndpoint | string | Yes | SQS endpoint URL |
| sqsQueueUrl | string | Yes | SQS queue URL |

## Event Message Format

Messages sent to SQS will have the following format:

```json
{
    "id": "uuid",
    "eventType": "EVENT_TYPE",
    "payload": {},
    "result": {},
    "timestamp": "ISO-8601 timestamp"
}
```

## License

ISC
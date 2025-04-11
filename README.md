# MongoDB Outbox Pattern with SQS

A Node.js package that implements the Outbox Pattern for MongoDB with AWS SQS integration. This pattern ensures reliable event publishing in distributed systems by using a transactional outbox.

## Installation

```bash
npm install yggdrasil
```

## Features

- Transactional outbox pattern implementation
- MongoDB transaction support
- AWS SQS integration
- Automatic outbox processing
- Error handling and status tracking

## Usage

```javascript
const { MongoDBOutboxSQS } = require('yggdrasil');

// Initialize the client
const outboxClient = new MongoDBOutboxSQS({
    mongoUri: 'your-mongodb-connection-string',
    dbName: 'your-database-name',
    outboxCollection: 'outbox', // optional, defaults to 'outbox'
    awsRegion: 'ap-southeast-1',
    awsAccessKeyId: 'your-aws-access-key',
    awsSecretAccessKey: 'your-aws-secret-key',
    sqsEndpoint: 'your-sqs-endpoint',
    sqsQueueUrl: 'your-sqs-queue-url'
});

// Example usage
async function createUserWithEvent() {
    try {
        const result = await outboxClient.executeWithOutbox(
            'users', // collection name
            async (collection, session) => {
                // Your database operation
                return await collection.insertOne(
                    { name: 'John Doe', email: 'john@example.com' },
                    { session }
                );
            },
            { userId: 'user123', action: 'user_created' }, // event payload
            'USER_CREATED' // event type
        );

        console.log('User created with outbox event:', result);
    } catch (error) {
        console.error('Failed to create user:', error);
    } finally {
        await outboxClient.close();
    }
}
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
# Outbox Pattern with SQS
A package that implements the Outbox Pattern for MongoDB and PostgreSQL with AWS SQS integration to ensure reliable event publishing in distributed systems.

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

### MongoDB

```javascript
const { MongoDBOutboxSQS } = require('outbox-service');

// Initialize the MongoDB client
const mongoOutboxClient = new MongoDBOutboxSQS({
    mongoUri: 'your-mongodb-connection-string',
    dbName: 'your-database-name',
    outboxCollection: 'outbox', // optional, defaults to 'outbox'
    awsRegion: 'ap-southeast-1',
    awsAccessKeyId: 'your-aws-access-key',
    awsSecretAccessKey: 'your-aws-secret-key',
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
        await mongoOutboxClient.close();
    }
}
```
### PostgreSQL

```javascript
const { PostgresOutboxSQS } = require('outbox-service');

// Initialize the PostgreSQL client
const pgOutboxClient = new PostgresOutboxSQS({
    pgHost: 'your-postgres-host',
    pgPort: 5432,
    pgDatabase: 'your-database-name',
    pgUser: 'your-postgres-user',
    pgPassword: 'your-postgres-password',
    pgSsl: false, // set to true if you need SSL
    outboxCollection: 'outbox', // optional, defaults to 'outbox'
    awsRegion: 'ap-southeast-1',
    awsAccessKeyId: 'your-aws-access-key',
    awsSecretAccessKey: 'your-aws-secret-key',
    sqsQueueUrl: 'your-sqs-queue-url'
});

// PostgreSQL Example usage
async function createUserWithPostgresEvent() {
    try {
        // Ensure the outbox table exists
        await pgOutboxClient.ensureOutboxTable();
        
        const result = await pgOutboxClient.executeWithOutbox(
            'users', // table name
            async (client, tableName) => {
                // Your PostgreSQL operation
                const result = await client.query(
                    `INSERT INTO ${tableName} (name, email, created_at) VALUES ($1, $2, $3) RETURNING *`,
                    ['John Doe', 'john@example.com', new Date()]
                );
                return result.rows[0];
            },
            { userId: 'user123', action: 'user_created' }, // event payload
            'USER_CREATED' // event type
        );
        console.log('User created:', result);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pgOutboxClient.close();
    }
}
```

## Configuration

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|krta h
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
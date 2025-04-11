/**
 * Type definitions for MongoDB Outbox Pattern with SQS
 */

declare module 'outbox-service' {
  export interface MongoDBOutboxSQSConfig {
    /**
     * MongoDB connection string
     */
    mongoUri: string;
    
    /**
     * Database name
     */
    dbName: string;
    
    /**
     * Name of the outbox collection (default: 'outbox')
     */
    outboxCollection?: string;
    
    /**
     * AWS region
     */
    awsRegion: string;
    
    /**
     * AWS access key ID
     */
    awsAccessKeyId: string;
    
    /**
     * AWS secret access key
     */
    awsSecretAccessKey: string;
    
    /**
     * SQS endpoint URL
     */
    sqsEndpoint: string;
    
    /**
     * SQS queue URL
     */
    sqsQueueUrl: string;
  }

  export class MongoDBOutboxSQS {
    constructor(config: MongoDBOutboxSQSConfig);
    
    /**
     * Connect to MongoDB
     */
    connect(): Promise<any>;
    
    /**
     * Close the MongoDB connection
     */
    close(): Promise<void>;
    
    /**
     * Execute a transaction with the outbox pattern
     * @param collectionName - The target collection name
     * @param operation - Function that takes a collection and performs the operation
     * @param eventPayload - The event payload to be sent to SQS
     * @param eventType - The type of event
     * @returns Result of the transaction
     */
    executeWithOutbox<T>(collectionName: string, operation: (collection: any, session: any) => Promise<T>, eventPayload: any, eventType: string): Promise<T>;
    
    /**
     * Process pending outbox messages
     */
    processOutbox(): Promise<void>;
    
    /**
     * Send a message to SQS
     * @param message - The message to send
     */
    sendToSQS(message: any): Promise<any>;
  }
}
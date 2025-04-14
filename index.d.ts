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
    awsRegion?: string;
    
    /**
     * AWS access key ID
     */
    awsAccessKeyId: string;
    
    /**
     * AWS secret access key
     */
    awsSecretAccessKey: string;
    
    /**
     * SQS queue URL
     */
    sqsQueueUrl: string;
  }

  export interface OutboxDocument {
    eventType: string;
    payload: any;
    result: any;
    status: 'PENDING' | 'PROCESSED' | 'FAILED';
    createdAt: Date;
    processedAt?: Date;
    errorAt?: Date;
    error?: string;
    _id?: any;
  }

  export interface SQSMessage {
    id: any;
    eventType: string;
    payload: any;
    result: any;
    timestamp: string;
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
     * @param object - The object to be operated on
     * @param operation - Function that performs the operation
     * @param eventPayload - The event payload to be sent to SQS
     * @param eventType - The type of event
     * @returns Result of the transaction
     */
    executeWithOutbox<T, U>(collectionName: string, object: T, operation: (object: T, collection: any, session: any) => Promise<U>, eventPayload: any, eventType: string): Promise<U>;
    
    /**
     * Process pending outbox messages
     */
    processOutbox(): Promise<void>;
    
    /**
     * Send a message to SQS
     * @param message - The message to send
     */
    sendToSQS(message: OutboxDocument): Promise<AWS.SQS.SendMessageResult>;
  }
}
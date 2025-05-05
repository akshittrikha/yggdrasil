/**
 * Type definitions for MongoDB Outbox Pattern with SQS
 */

declare module 'outbox-service' {
  export interface BaseOutboxConfig {
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

  export interface MongoDBOutboxSQSConfig extends BaseOutboxConfig {
    /**
     * MongoDB connection string
     */
    mongoUri: string;
    
    /**
     * Database name
     */
    dbName: string;
  }

  export interface PostgresOutboxSQSConfig extends BaseOutboxConfig {
    /**
     * PostgreSQL host
     */
    pgHost: string;
    
    /**
     * PostgreSQL port
     */
    pgPort?: number;
    
    /**
     * PostgreSQL database name
     */
    pgDatabase: string;
    
    /**
     * PostgreSQL user
     */
    pgUser: string;
    
    /**
     * PostgreSQL password
     */
    pgPassword: string;
    
    /**
     * Use SSL for PostgreSQL connection
     */
    pgSsl?: boolean;
    
    /**
     * Maximum number of clients in the PostgreSQL connection pool
     */
    pgPoolMax?: number;
    
    /**
     * PostgreSQL connection idle timeout
     */
    pgIdleTimeout?: number;
  }

    export abstract class OutboxBase {
    constructor(config: BaseOutboxConfig);
    
    /**
     * Connect to the database
     */
    abstract connect(): Promise<any>;
    
    /**
     * Close the database connection
     */
    abstract close(): Promise<void>;
    
    /**
     * Execute a transaction with the outbox pattern
     * @param tableName - The target table/collection name
     * @param operation - Function that performs the operation
     * @param eventPayload - The event payload to be sent to SQS
     * @param eventType - The type of event
     * @returns Result of the transaction
     */
    abstract executeWithOutbox<T>(tableName: string, operation: Function, eventPayload: any, eventType: string): Promise<T>;
    
    /**
     * Process pending outbox messages
     */
    abstract processOutbox(): Promise<void>;
    
    /**
     * Send a message to SQS
     * @param message - The message to send
     */
    sendToSQS(message: any): Promise<any>;
  }

  export class MongoDBOutboxSQS extends OutboxBase {
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
  }

  export class PostgresOutboxSQS extends OutboxBase {
    constructor(config: PostgresOutboxSQSConfig);
    
    /**
     * Connect to PostgreSQL
     */
    connect(): Promise<any>;
    
    /**
     * Close the PostgreSQL connection
     */
    close(): Promise<void>;
    
    /**
     * Execute a transaction with the outbox pattern
     * @param tableName - The target table name
     * @param operation - Function that takes a client and table name and performs the operation
     * @param eventPayload - The event payload to be sent to SQS
     * @param eventType - The type of event
     * @returns Result of the transaction
     */
    executeWithOutbox<T>(tableName: string, operation: (client: any, tableName: string) => Promise<T>, eventPayload: any, eventType: string): Promise<T>;
    
    /**
     * Process pending outbox messages
     */
    processOutbox(): Promise<void>;
    
    /**
     * Create the outbox table if it doesn't exist
     */
    ensureOutboxTable(): Promise<void>;
  }
}
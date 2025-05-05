/**
 * PostgreSQL implementation of the Outbox pattern
 */
const { Pool } = require('pg');
const OutboxBase = require('./base');

class PostgresOutboxSQS extends OutboxBase {
  constructor(config) {
    super(config);
    this.pgConfig = {
      host: config.pgHost,
      port: config.pgPort || 5432,
      database: config.pgDatabase,
      user: config.pgUser,
      password: config.pgPassword,
      ssl: config.pgSsl,
      max: config.pgPoolMax || 20,
      idleTimeoutMillis: config.pgIdleTimeout || 30000
    };
    
    this.pool = null;
    this.client = null;
  }

  async connect() {
    if (!this.pool) {
      this.pool = new Pool(this.pgConfig);
    }
    return this.pool;
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  /**
   * Execute a transaction with the outbox pattern
   * @param {string} tableName - The target table name
   * @param {Function} operation - Function that takes a client and performs the operation
   * @param {Object} eventPayload - The event payload to be sent to SQS
   * @param {string} eventType - The type of event
   * @returns {Object} - Result of the transaction
   */
  async executeWithOutbox(tableName, operation, eventPayload, eventType) {
    const pool = await this.connect();
    const client = await pool.connect();
    let result;

    try {
      // Start transaction
      await client.query('BEGIN');

      try {
        // 1. Perform the main operation on the target table
        console.log(`[ob] table: ${tableName}`);
        result = await operation(client, tableName);

        // 2. Insert into outbox table
        const outboxDocument = {
          eventType,
          payload: eventPayload,
          result,
          status: 'PENDING',
          createdAt: new Date()
        };

        const insertQuery = `
          INSERT INTO ${this.outboxCollection} 
          (event_type, payload, result, status, created_at) 
          VALUES ($1, $2, $3, $4, $5) 
          RETURNING id
        `;
        
        const insertValues = [
          outboxDocument.eventType,
          JSON.stringify(outboxDocument.payload),
          JSON.stringify(outboxDocument.result),
          outboxDocument.status,
          outboxDocument.createdAt
        ];

        await client.query(insertQuery, insertValues);

        // Commit the transaction
        await client.query('COMMIT');
      } catch (error) {
        // Rollback in case of error
        await client.query('ROLLBACK');
        throw error;
      }

      // 3. After transaction is committed, process the outbox
      await this.processOutbox();

      return result;
    } catch (error) {
      console.error('Transaction failed:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async processOutbox() {
    const pool = await this.connect();
    const client = await pool.connect();
    
    try {
      // Find all pending outbox messages
      const pendingQuery = `SELECT * FROM ${this.outboxCollection} WHERE status = 'PENDING'`;
      const { rows: pendingMessages } = await client.query(pendingQuery);
      
      for (const message of pendingMessages) {
        try {
          // Send to SQS
          await this.sendToSQS(message);

          // Update status to PROCESSED
          const updateQuery = `
            UPDATE ${this.outboxCollection} 
            SET status = 'PROCESSED', processed_at = $1 
            WHERE id = $2
          `;
          await client.query(updateQuery, [new Date(), message.id]);
        } catch (error) {
          console.error(`Failed to process outbox message ${message.id}`, error);

          // Update status to FAILED
          const failedQuery = `
            UPDATE ${this.outboxCollection} 
            SET status = 'FAILED', error = $1, error_at = $2 
            WHERE id = $3
          `;
          await client.query(failedQuery, [error.message, new Date(), message.id]);
        }
      }
    } finally {
      client.release();
    }
  }

  /**
   * Create the outbox table if it doesn't exist
   */
  async ensureOutboxTable() {
    const pool = await this.connect();
    const client = await pool.connect();
    
    try {
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS ${this.outboxCollection} (
          id SERIAL PRIMARY KEY,
          event_type VARCHAR(255) NOT NULL,
          payload JSONB NOT NULL,
          result JSONB,
          status VARCHAR(50) NOT NULL,
          created_at TIMESTAMP NOT NULL,
          processed_at TIMESTAMP,
          error TEXT,
          error_at TIMESTAMP
        )
      `;
      
      await client.query(createTableQuery);
      console.log(`Ensured outbox table '${this.outboxCollection}' exists`);
    } finally {
      client.release();
    }
  }
}

module.exports = PostgresOutboxSQS;
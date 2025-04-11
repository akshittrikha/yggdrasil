# Changelog

## [1.0.0] - 2024-01-17

### Added
- Initial release of MongoDB Outbox Pattern with SQS integration
- Transactional outbox pattern implementation ensuring reliable event publishing
- MongoDB transaction support with automatic outbox processing
- AWS SQS integration for event message delivery
- Environment variable support for configuration management
- TypeScript type definitions for better development experience
- Comprehensive error handling and status tracking
- Example implementation showcasing user creation with event publishing

### Configuration
- Flexible configuration options for MongoDB connection
  - MongoDB URI
  - Database name
  - Customizable outbox collection name
- AWS SQS configuration support
  - Region configuration
  - Access key management
  - SQS queue URL configuration

### Documentation
- Added detailed README with usage examples
- Included example.js demonstrating practical implementation
- Environment variable template in .env.example

### Dependencies
- Requires Node.js environment
- MongoDB driver for database operations
- AWS SDK for SQS integration
- dotenv for environment variable management
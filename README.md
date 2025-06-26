# Odoo XML SDK for TypeScript

A comprehensive TypeScript SDK for interacting with Odoo's XML-RPC API. This library provides type-safe operations for CRUD operations, authentication, field validation, and error handling.

## Features

- **Type-safe**: Full TypeScript support with comprehensive type definitions
- **XML-RPC Client**: Native XML-RPC implementation without external dependencies
- **Authentication**: Secure authentication with session management
- **CRUD Operations**: Create, Read, Update, Delete operations for Odoo models
- **Search & Filter**: Advanced search capabilities with domain filtering
- **Field Validation**: Automatic field validation based on Odoo model definitions
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **Retry Logic**: Configurable retry logic for network failures

## Installation

```bash
npm install odoo-xml-sdk
```

## Quick Start

```typescript
import { OdooClient } from 'odoo-xml-sdk';

const client = new OdooClient({
  url: 'https://your-odoo-instance.com',
  database: 'your_database',
  username: 'your_username',
  password: 'your_password'
});

// Connect to Odoo
const authResult = await client.connect();
if (!authResult.success) {
  console.error('Authentication failed:', authResult.error);
  return;
}

// Work with models
const partners = client.model('res.partner');

// Create a new partner
const createResult = await partners.create({
  name: 'John Doe',
  email: 'john@example.com'
});

// Search for partners
const searchResult = await partners.searchRead([
  { field: 'name', operator: 'ilike', value: 'John' }
]);

console.log('Partners found:', searchResult.data);
```

## API Documentation

### OdooClient

The main client class for interacting with Odoo.

```typescript
const client = new OdooClient(config, retryOptions?);
```

#### Methods

- `connect()`: Authenticate with Odoo
- `getVersion()`: Get Odoo version information
- `model(modelName)`: Get a model client for specific Odoo model
- `createFieldMapper(modelName)`: Create a field mapper for validation
- `isConnected()`: Check if client is authenticated
- `getUserId()`: Get current user ID
- `getConfig()`: Get current configuration

### OdooModelClient

Client for working with specific Odoo models.

```typescript
const model = client.model('res.partner');
```

#### CRUD Operations

```typescript
// Create
const result = await model.create({ name: 'Test' });

// Read
const records = await model.read([1, 2, 3], ['name', 'email']);

// Update
const updated = await model.update([1], { name: 'Updated Name' });

// Delete
const deleted = await model.delete([1]);
```

#### Search Operations

```typescript
// Simple search
const ids = await model.search([
  { field: 'name', operator: 'ilike', value: 'test' }
]);

// Search with options
const results = await model.search([
  { field: 'active', operator: '=', value: true }
], {
  limit: 10,
  offset: 0,
  order: 'name asc'
});

// Search and read
const records = await model.searchRead([
  { field: 'customer_rank', operator: '>', value: 0 }
], ['name', 'email', 'phone']);

// Count records
const count = await model.count([
  { field: 'active', operator: '=', value: true }
]);
```

#### Field Information

```typescript
// Get field definitions
const fields = await model.getFields();

// Get specific field attributes
const fields = await model.getFields(['string', 'type', 'required']);
```

#### Custom Methods

```typescript
// Call custom model methods
const result = await model.callMethod('custom_method', [arg1, arg2], {
  context: { lang: 'en_US' }
});
```

### Domain Filters

Odoo uses domain filters for searching. The SDK supports the standard Odoo domain syntax:

```typescript
// Simple conditions
const domain = [
  { field: 'name', operator: 'ilike', value: 'john' },
  { field: 'active', operator: '=', value: true }
];

// Complex conditions with logical operators
const complexDomain = [
  '|', // OR operator
  { field: 'name', operator: 'ilike', value: 'john' },
  { field: 'email', operator: 'ilike', value: 'john' },
  '&', // AND operator (default)
  { field: 'active', operator: '=', value: true },
  { field: 'customer_rank', operator: '>', value: 0 }
];
```

### Field Validation

```typescript
// Create field mapper for validation
const mapper = await client.createFieldMapper('res.partner');

// Validate record before saving
const validation = mapper.validateRecord({
  name: 'John Doe',
  email: 'invalid-email' // This will fail validation
});

if (!validation.isValid) {
  console.error('Validation errors:', validation.errors);
}

// Transform record (type conversion)
const transformed = mapper.transformRecord({
  name: 'John Doe',
  customer_rank: '5' // String will be converted to number
});
```

### Error Handling

The SDK provides comprehensive error handling with custom error types:

```typescript
import { 
  OdooError, 
  OdooAuthenticationError, 
  OdooConnectionError, 
  OdooValidationError 
} from 'odoo-xml-sdk';

try {
  const result = await client.connect();
} catch (error) {
  if (error instanceof OdooAuthenticationError) {
    console.error('Authentication failed:', error.message);
  } else if (error instanceof OdooConnectionError) {
    console.error('Connection failed:', error.message);
  } else if (error instanceof OdooValidationError) {
    console.error('Validation failed:', error.validationErrors);
  } else {
    console.error('Unknown error:', error.message);
  }
}
```

### Retry Configuration

Configure automatic retries for network failures:

```typescript
const client = new OdooClient(config, {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryCondition: (error) => {
    // Custom retry logic
    return error.code === 'ECONNRESET';
  }
});
```

## Configuration

```typescript
interface OdooConfig {
  url: string;           // Odoo instance URL
  database: string;      // Database name
  username: string;      // Username
  password: string;      // Password
  timeout?: number;      // Request timeout (default: 30000ms)
}
```

## Common Use Cases

### Working with Partners

```typescript
const partners = client.model('res.partner');

// Create a customer
const customer = await partners.create({
  name: 'ACME Corp',
  is_company: true,
  customer_rank: 1,
  email: 'contact@acme.com',
  phone: '+1-555-0123'
});

// Find all customers
const customers = await partners.searchRead([
  { field: 'customer_rank', operator: '>', value: 0 }
], ['name', 'email', 'phone']);
```

### Working with Sales Orders

```typescript
const orders = client.model('sale.order');

// Create a sales order
const order = await orders.create({
  partner_id: 1,
  order_line: [
    [0, 0, { // Create new order line
      product_id: 1,
      product_uom_qty: 2,
      price_unit: 100.0
    }]
  ]
});

// Confirm the order
await orders.callMethod('action_confirm', [[order.data.id]]);
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines and submit pull requests to our repository.
# @abyss/shared-utils

Comprehensive utility library for Abyss Central suite with validation, encryption, formatting, datetime, logging, and common helper functions.

## Features

- 🔐 **Security-First** - Password hashing, encryption, input sanitization
- ✅ **Validation** - Joi and Zod schemas, input validation, sanitization
- 🔒 **Encryption** - AES encryption, bcrypt hashing, secure token generation
- 📅 **DateTime** - Date manipulation, timezone handling, business calendar
- 📝 **Formatting** - Currency, numbers, text, addresses, dates
- 📊 **Logging** - Structured logging with Winston, correlation IDs, audit trails
- 🛠️ **Utilities** - Common helper functions for arrays, objects, async operations

## Installation

This library is part of the Abyss Central monorepo and is used internally by the suite applications.

```bash
# Install dependencies in the monorepo root
npm install
```

## Usage

### Validation

```typescript
import { 
  validateWithJoi, 
  validateWithZod,
  commonJoiSchemas,
  commonZodSchemas,
  sanitizeHtml,
  isValidEmail 
} from '@abyss/shared-utils/validation';

// Joi validation
const userSchema = Joi.object({
  email: commonJoiSchemas.email.required(),
  password: commonJoiSchemas.password.required(),
  age: commonJoiSchemas.positiveInteger.optional()
});

const result = validateWithJoi(userData, userSchema);
if (result.isValid) {
  console.log('Valid data:', result.data);
} else {
  console.log('Errors:', result.errors);
}

// Zod validation
const itemSchema = z.object({
  name: commonZodSchemas.nonEmptyString,
  sku: commonZodSchemas.sku,
  price: commonZodSchemas.currency
});

// Input sanitization
const safeHtml = sanitizeHtml(userInput);
const isEmail = isValidEmail('user@example.com');
```

### Encryption

```typescript
import { 
  hashPassword,
  verifyPassword,
  encryptData,
  decryptData,
  generateSecureToken,
  generateApiKey 
} from '@abyss/shared-utils/encryption';

// Password hashing
const hashedPassword = await hashPassword('userPassword123');
const isValid = await verifyPassword('userPassword123', hashedPassword);

// Data encryption
const secretKey = 'your-secret-key';
const encrypted = encryptData('sensitive data', secretKey);
const decrypted = decryptData(encrypted, secretKey);

// Token generation
const token = generateSecureToken(32);
const apiKey = generateApiKey('ak');
```

### Formatting

```typescript
import { 
  formatCurrency,
  formatPercentage,
  formatFileSize,
  toTitleCase,
  truncateText,
  formatPhoneNumber,
  formatRelativeTime 
} from '@abyss/shared-utils/formatting';

// Number formatting
const price = formatCurrency(1234.56); // "$1,234.56"
const percent = formatPercentage(85.7); // "85.7%"
const fileSize = formatFileSize(1048576); // "1.00 MB"

// Text formatting
const title = toTitleCase('hello world'); // "Hello World"
const truncated = truncateText('Long text...', 20); // "Long text..."

// Contact formatting
const phone = formatPhoneNumber('1234567890'); // "(123) 456-7890"
const timeAgo = formatRelativeTime(new Date(Date.now() - 3600000)); // "1 hour ago"
```

### DateTime

```typescript
import { 
  parseDate,
  isDateInRange,
  addBusinessDays,
  getBusinessDaysBetween,
  formatDuration,
  isWithinBusinessHours 
} from '@abyss/shared-utils/datetime';

// Date parsing and validation
const date = parseDate('2024-01-15T10:30:00Z');
const isInRange = isDateInRange(date, '2024-01-01', '2024-01-31');

// Business calendar
const futureDate = addBusinessDays(new Date(), 5);
const businessDays = getBusinessDaysBetween('2024-01-01', '2024-01-15');

// Time utilities
const duration = formatDuration(90); // "1h 30m"
const inBusinessHours = isWithinBusinessHours(new Date());
```

### Logging

```typescript
import { 
  StructuredLogger,
  logBusinessEvent,
  logSecurityEvent,
  defaultLogger 
} from '@abyss/shared-utils/logger';

// Create structured logger
const logger = new StructuredLogger({
  service: 'inventory-service',
  level: 'info'
});

// Basic logging
logger.info('User logged in', { userId: '123', correlationId: 'abc-123' });
logger.error('Database connection failed', error, { action: 'db_connect' });

// Business event logging
logBusinessEvent(logger, {
  eventType: 'inventory_update',
  entityType: 'item',
  entityId: 'item-123',
  action: 'quantity_updated',
  userId: 'user-456',
  changes: {
    quantity: { from: 10, to: 8 }
  }
});

// Security event logging
logSecurityEvent(logger, {
  eventType: 'authentication',
  action: 'login_attempt',
  userId: 'user-123',
  success: true,
  ip: '192.168.1.1'
});
```

### Common Utilities

```typescript
import { 
  deepClone,
  debounce,
  retry,
  groupBy,
  unique,
  isEmpty,
  pick,
  omit 
} from '@abyss/shared-utils';

// Object utilities
const cloned = deepClone(originalObject);
const picked = pick(user, ['id', 'name', 'email']);
const omitted = omit(user, ['password', 'secret']);

// Array utilities
const grouped = groupBy(items, item => item.category);
const uniqueItems = unique(items, item => item.id);

// Function utilities
const debouncedSave = debounce(saveFunction, 500);
const result = await retry(() => apiCall(), 3, 1000);

// Type checking
const hasData = !isEmpty(value);
```

## Modules

### Validation (`@abyss/shared-utils/validation`)

**Input Validation & Sanitization:**
- **Joi Schemas** - Pre-built schemas for common data types
- **Zod Schemas** - Type-safe validation schemas
- **Sanitization** - HTML, SQL, file name, URL sanitization
- **Validation Helpers** - Email, UUID, phone, password strength

**Security Features:**
- XSS prevention through HTML sanitization
- SQL injection prevention
- Path traversal protection for file names
- Password strength validation

### Encryption (`@abyss/shared-utils/encryption`)

**Password Security:**
- **bcrypt Hashing** - Secure password hashing with configurable cost
- **Password Verification** - Timing-safe password comparison
- **Rehash Detection** - Check if passwords need rehashing

**Data Encryption:**
- **AES-256-GCM** - Symmetric encryption for sensitive data
- **Object Encryption** - JSON object encryption/decryption
- **Secure Token Generation** - Cryptographically secure random tokens

**Security Utilities:**
- **Data Masking** - Mask sensitive data for logging
- **HMAC Signatures** - Message authentication codes
- **Secure Random** - Cryptographically secure random generation

### Formatting (`@abyss/shared-utils/formatting`)

**Number Formatting:**
- **Currency** - Locale-aware currency formatting
- **Percentages** - Percentage formatting with precision
- **Large Numbers** - K, M, B abbreviations
- **File Sizes** - Human-readable file size formatting

**Text Formatting:**
- **Case Conversion** - Title, camel, kebab, snake, pascal case
- **Text Truncation** - Smart text truncation with ellipsis
- **Whitespace Normalization** - Clean up extra whitespace

**Business Formatting:**
- **SKU Formatting** - Standardized SKU format
- **Order Numbers** - Order number with prefix
- **Quantity Display** - Quantity with units
- **Status Badges** - Human-readable status formatting

### DateTime (`@abyss/shared-utils/datetime`)

**Date Operations:**
- **Parsing & Validation** - Safe date parsing with validation
- **Date Calculations** - Add/subtract days, weeks, months, years
- **Date Comparisons** - Before, after, overlap detection
- **Range Generation** - Generate date ranges and intervals

**Business Calendar:**
- **Business Days** - Add business days, skip weekends
- **Holiday Detection** - US holiday checking
- **Working Hours** - Business hours validation

**Timezone Support:**
- **Timezone Conversion** - Convert dates to user timezone
- **Timezone Detection** - Get user's timezone automatically

### Logger (`@abyss/shared-utils/logger`)

**Structured Logging:**
- **Winston Integration** - Production-ready logging with Winston
- **Correlation IDs** - Request tracking across services
- **Contextual Logging** - Attach context to all log entries
- **Multiple Transports** - Console, file, and syslog support

**Business Logging:**
- **Audit Trails** - Business event logging for compliance
- **Security Events** - Authentication, authorization logging
- **Performance Metrics** - Operation timing and resource usage
- **Request/Response** - HTTP request/response logging

## Configuration

### Environment Variables

```bash
# Logging
LOG_LEVEL=info
SERVICE_NAME=your-service
SERVICE_VERSION=1.0.0
LOG_DIRECTORY=./logs

# Security
ENCRYPTION_KEY=your-secret-key
JWT_SECRET=your-jwt-secret
BCRYPT_ROUNDS=12
```

### Logger Configuration

```typescript
const logger = new StructuredLogger({
  level: 'info',
  service: 'inventory-service',
  environment: 'production',
  enableFile: true,
  enableJsonFormat: true,
  logDirectory: './logs',
  maxFileSize: '10m',
  maxFiles: 5
});
```

## Security Features

### Input Validation
- **XSS Prevention** - HTML sanitization and encoding
- **SQL Injection Prevention** - Input sanitization for database queries
- **File Upload Security** - File name and type validation
- **URL Validation** - Safe URL parsing and validation

### Encryption & Hashing
- **Password Security** - bcrypt with cost factor ≥12
- **Data Encryption** - AES-256-GCM for sensitive data
- **Secure Tokens** - Cryptographically secure random generation
- **HMAC Signatures** - Message authentication and integrity

### Logging Security
- **Data Masking** - Automatic masking of sensitive fields
- **Structured Logs** - Consistent log format for security monitoring
- **Correlation Tracking** - Request correlation across services
- **Audit Trails** - Complete audit logging for compliance

## Best Practices

1. **Always Validate Input** - Use validation schemas for all user input
2. **Sanitize Before Storage** - Clean data before database operations
3. **Hash Passwords Securely** - Use bcrypt with cost factor ≥12
4. **Encrypt Sensitive Data** - Use AES encryption for PII and secrets
5. **Log Structured Data** - Include correlation IDs and context
6. **Mask Sensitive Information** - Never log passwords or tokens
7. **Use Business Calendars** - Consider weekends and holidays in calculations
8. **Format for Users** - Use locale-aware formatting for international users

## Development

```bash
# Build the library
turbo run build --filter=@abyss/shared-utils

# Watch mode for development
turbo run dev --filter=@abyss/shared-utils

# Run tests
turbo run test --filter=@abyss/shared-utils

# Type checking
turbo run typecheck --filter=@abyss/shared-utils
```

## Testing

```typescript
import { validateWithJoi, hashPassword, formatCurrency } from '@abyss/shared-utils';

describe('Utilities', () => {
  test('validation works correctly', () => {
    const result = validateWithJoi({ email: 'test@example.com' }, schema);
    expect(result.isValid).toBe(true);
  });
  
  test('password hashing is secure', async () => {
    const hash = await hashPassword('password123');
    expect(hash).not.toBe('password123');
    expect(hash.length).toBeGreaterThan(50);
  });
  
  test('currency formatting is locale-aware', () => {
    const formatted = formatCurrency(1234.56, 'USD', 'en-US');
    expect(formatted).toBe('$1,234.56');
  });
});
```

## Architecture

- **Security-First Design** - All utilities prioritize security
- **TypeScript Native** - Full type safety and IntelliSense
- **Modular Architecture** - Import only what you need
- **Zero Dependencies** - Minimal external dependencies
- **Production Ready** - Battle-tested utilities for enterprise use

---

Built with ❤️ for reliable, secure utility functions in the Abyss Central Suite
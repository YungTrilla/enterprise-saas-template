# Security Guide - Abyss Central

Comprehensive security documentation for the Abyss Central Event Rental
Management Suite.

## 🛡️ Security Overview

Abyss Central implements security-first design principles with multiple layers
of protection to safeguard sensitive business and customer data.

### Security Architecture

- **Defense in Depth** - Multiple security layers for comprehensive protection
- **Zero Trust** - Verify every request, trust nothing by default
- **Principle of Least Privilege** - Minimal access rights only
- **Security by Design** - Security built into every component from the ground
  up

## 🔒 Security Tools & Scanning

### Automated Security Scanning

The project includes comprehensive security scanning tools that run
automatically:

#### 1. Static Application Security Testing (SAST)

- **Semgrep** - Detects code vulnerabilities and security issues
- **CodeQL** - Advanced semantic code analysis
- **Custom Rules** - Project-specific security patterns

#### 2. Secret Detection

- **GitLeaks** - Prevents secrets from being committed to git
- **TruffleHog** - Advanced secret detection with verification
- **Pre-commit Hooks** - Blocks commits containing sensitive data

#### 3. Dependency Scanning

- **npm audit** - Identifies vulnerable dependencies
- **Snyk** - Continuous dependency monitoring
- **Dependabot** - Automated security updates

### Running Security Scans

```bash
# Comprehensive security scan
pnpm run security:scan

# Individual tool scans
pnpm run security:secrets    # Secret detection
pnpm run security:deps      # Dependency vulnerabilities
pnpm run security:sast      # Static code analysis

# Setup security tools
pnpm run security:install   # Install security tools
pnpm run security:setup     # Setup pre-commit hooks
```

### Security Scan Results

Security scan results are stored in `security-scan-results/` with:

- Detailed reports for each tool
- Consolidated security summary
- Remediation recommendations
- Severity-based prioritization

## 🔐 Authentication & Authorization

### JWT Token Management

- **Access Tokens**: 15-minute expiration
- **Refresh Tokens**: 7-day expiration
- **Secure Storage**: httpOnly, secure, sameSite cookies
- **Token Rotation**: Automatic refresh token rotation

### Multi-Factor Authentication (MFA)

- Required for admin accounts
- TOTP-based (Google Authenticator, Authy)
- Backup codes for recovery
- Device registration and management

### Role-Based Access Control (RBAC)

```typescript
// Permission levels
enum Permission {
  // User management
  USER_READ = 'user:read',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',

  // Inventory management
  INVENTORY_READ = 'inventory:read',
  INVENTORY_WRITE = 'inventory:write',

  // Financial data
  FINANCIAL_READ = 'financial:read',
  FINANCIAL_WRITE = 'financial:write',
}

// Role definitions
const ROLES = {
  EMPLOYEE: [Permission.USER_READ, Permission.INVENTORY_READ],
  MANAGER: [...EMPLOYEE, Permission.USER_CREATE, Permission.INVENTORY_WRITE],
  ADMIN: [...MANAGER, Permission.USER_DELETE, Permission.FINANCIAL_READ],
  SUPER_ADMIN: [...ADMIN, Permission.FINANCIAL_WRITE],
};
```

## 🔓 Data Protection

### Encryption Standards

- **Data at Rest**: AES-256 encryption for all sensitive data
- **Data in Transit**: TLS 1.3 for all communications
- **Database Encryption**: PostgreSQL transparent data encryption
- **Key Management**: Secure key rotation and storage

### Personal Identifiable Information (PII)

```typescript
// PII handling guidelines
interface PIIData {
  // Always encrypted
  ssn?: string; // Social Security Number
  bankAccount?: string; // Financial information

  // Encrypted in production
  email: string; // Contact information
  phone?: string; // Phone numbers
  address?: Address; // Physical addresses

  // Hashed storage only
  password: string; // Never store plain text
}
```

### Data Classification

- **Public**: Marketing materials, public documentation
- **Internal**: Business processes, non-sensitive operations
- **Confidential**: Customer data, business metrics
- **Restricted**: Financial records, authentication credentials

## 🌐 API Security

### Input Validation

```typescript
// Example validation schema
const userCreateSchema = z.object({
  firstName: z.string().min(1).max(50),
  lastName: z.string().min(1).max(50),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/),
  roles: z.array(z.enum(['employee', 'manager', 'admin'])),
});

// All inputs validated before processing
app.post('/api/users', validateInput(userCreateSchema), createUser);
```

### Rate Limiting

- **API Endpoints**: 100 requests/minute per IP
- **Authentication**: 5 failed attempts = 15-minute lockout
- **Password Reset**: 3 attempts/hour per email
- **Distributed Rate Limiting**: Redis-based across services

### API Security Headers

```typescript
// Security headers for all responses
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);
```

## 🗄️ Database Security

### Connection Security

- **Encrypted Connections**: SSL/TLS required
- **Connection Pooling**: Limited, authenticated connections
- **Service Isolation**: Each service has dedicated database
- **Credential Management**: Environment-based, rotated regularly

### Query Security

```typescript
// ✅ Safe: Parameterized queries only
const user = await db.query('SELECT * FROM users WHERE email = $1', [email]);

// ❌ Dangerous: Never use string concatenation
const query = `SELECT * FROM users WHERE email = '${email}'`; // SQL injection risk
```

### Database Monitoring

- **Query Performance**: Slow query detection
- **Access Logging**: All database access logged
- **Anomaly Detection**: Unusual access patterns
- **Backup Security**: Encrypted backups with access controls

## 🐳 Infrastructure Security

### Container Security

- **Base Images**: Official, minimal images only
- **Non-root Users**: All containers run as non-root
- **Resource Limits**: CPU/memory constraints
- **Security Scanning**: Container vulnerability scanning

### Docker Security Checklist

```dockerfile
# ✅ Best practices
FROM node:18-alpine
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001
USER nextjs
COPY --chown=nextjs:nodejs . .
EXPOSE 3000
```

### Network Security

- **Service Mesh**: Encrypted inter-service communication
- **Network Segmentation**: Isolated service networks
- **Firewall Rules**: Restrictive ingress/egress
- **VPN Access**: Required for production access

## 🚨 Incident Response

### Security Incident Classification

1. **Critical**: Data breach, system compromise
2. **High**: Authentication bypass, privilege escalation
3. **Medium**: Denial of service, data corruption
4. **Low**: Information disclosure, configuration issues

### Response Procedures

1. **Detection**: Automated monitoring and alerting
2. **Assessment**: Severity and impact evaluation
3. **Containment**: Immediate threat isolation
4. **Eradication**: Root cause elimination
5. **Recovery**: System restoration and validation
6. **Lessons Learned**: Post-incident review

### Emergency Contacts

- **Security Team**: security@void-software.com
- **On-call Engineer**: +1-XXX-XXX-XXXX
- **Legal/Compliance**: legal@void-software.com

## 📊 Security Monitoring

### Real-time Monitoring

- **Authentication Events**: Login attempts, MFA usage
- **Authorization Failures**: Permission denials, privilege escalation attempts
- **Data Access**: Sensitive data queries and modifications
- **System Anomalies**: Unusual patterns, performance issues

### Security Metrics

```typescript
// Example security metrics
interface SecurityMetrics {
  failedLogins: number; // Failed authentication attempts
  mfaAdoptions: number; // MFA usage rate
  vulnerabilitiesFound: number; // Security scan findings
  patchTime: number; // Time to patch vulnerabilities
  incidentResponse: number; // Response time to incidents
}
```

### Alerting Rules

- **Immediate**: Authentication anomalies, data breaches
- **High Priority**: Vulnerability discoveries, access violations
- **Medium Priority**: Performance issues, configuration changes
- **Low Priority**: Informational events, usage statistics

## 🎯 Security Best Practices

### Development Security

1. **Secure Coding**: Follow OWASP guidelines
2. **Code Reviews**: Security-focused peer reviews
3. **Testing**: Security tests in CI/CD pipeline
4. **Dependencies**: Regular updates and vulnerability scanning

### Operational Security

1. **Access Control**: Principle of least privilege
2. **Monitoring**: Continuous security monitoring
3. **Incident Response**: Tested response procedures
4. **Training**: Regular security awareness training

### Data Security

1. **Classification**: Proper data categorization
2. **Encryption**: Data protection at rest and in transit
3. **Retention**: Secure data lifecycle management
4. **Privacy**: GDPR/CCPA compliance

## 📋 Security Checklist

### Pre-deployment Security Review

- [ ] **Code Security**: SAST scan passed
- [ ] **Dependencies**: No critical vulnerabilities
- [ ] **Secrets**: No hardcoded credentials
- [ ] **Authentication**: Proper access controls
- [ ] **Encryption**: Sensitive data encrypted
- [ ] **Logging**: Security events logged
- [ ] **Monitoring**: Alerts configured
- [ ] **Documentation**: Security measures documented

### Periodic Security Tasks

- [ ] **Weekly**: Dependency vulnerability scan
- [ ] **Monthly**: Access review and cleanup
- [ ] **Quarterly**: Penetration testing
- [ ] **Annually**: Security architecture review

## 🔗 Security Resources

### Internal Documentation

- [Authentication Guide](./AUTH.md)
- [API Security Standards](./API.md)
- [Database Security](./DATABASE.md)
- [Deployment Security](./DEPLOYMENT.md)

### External Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CIS Controls](https://www.cisecurity.org/controls/)
- [SANS Security Policies](https://www.sans.org/information-security-policy/)

### Security Tools Documentation

- [Semgrep Rules](https://semgrep.dev/docs/)
- [GitLeaks Configuration](https://github.com/gitleaks/gitleaks)
- [TruffleHog Setup](https://trufflesecurity.com/trufflehog)
- [Snyk Integration](https://docs.snyk.io/)

---

## 🚨 Security Incident Reporting

If you discover a security vulnerability or incident:

1. **Do NOT** create a public issue
2. **Email**: security@void-software.com
3. **Include**: Detailed description, reproduction steps, impact assessment
4. **Response**: We will acknowledge within 24 hours

**Remember: Security is everyone's responsibility!**

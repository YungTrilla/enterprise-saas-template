# Enterprise SaaS Template - Claude Development Assistant Guide

## 🎯 Project Overview

This is the **Enterprise SaaS Template** - a comprehensive, production-ready
template for building enterprise-grade SaaS applications with TypeScript, React,
and microservices architecture.

## 🏠 **MANDATORY HOUSE RULES** - ALWAYS FOLLOW THESE

### 1. Code Organization

- **Keep files under 200-300 lines**; refactor if they grow larger
- **NEVER go over 500 lines** in one file/module
- **Each function should be 10-30 lines**
- **Each class should be 50-200 lines**
- **Use explicit, descriptive variable names**
- **Follow existing coding style** for consistency
- **Always follow modular design** for maintainability and reusability

### 2. Environment Awareness

- **Always consider dev, test, and production** environments when writing code
- **Avoid hardcoding environment-specific values**; use configuration files or
  environment variables

### 3. Security - CRITICAL SECURITY PROTOCOLS

- **Security-first mindset** - security considerations in EVERY design decision
- **NEVER expose sensitive data** (PII, API keys, passwords, tokens, financial
  data)
- **Implement defense in depth** - multiple layers of security controls
- **Follow principle of least privilege** - minimal access rights only
- **Input validation on ALL data** - sanitize, validate, escape user inputs
- **Secure authentication/authorization** - proper JWT handling, session
  management
- **Encrypt data at rest and in transit** - TLS 1.3, database encryption
- **Security logging and monitoring** - track access patterns, failed attempts
- **Regular security reviews** - code audits, dependency scans, penetration
  testing
- **Incident response plan** - clear procedures for security breaches

### 4. Performance

- **Optimize for performance** where applicable
- **Avoid unnecessary computations** and memory usage

### 5. Documentation

- **Document complex logic** and decisions
- **Use comments to clarify intent**, not to restate code
- **Update architectural documentation** when making structural changes
- **Maintain implementation plans** for new features

### 6. Testing

- **Comprehensive test coverage** required for all new/modified code
- **Use assertions** to validate assumptions and catch errors early
- **Consider edge cases** in all logic
- **Follow 3-tier testing strategy** (unit, integration, contract tests)

### 7. Data Handling

- **Do NOT include user-identifying information** in anonymous contexts
- **Use named constants** instead of magic numbers

### 8. Error Handling

- **Implement robust error handling** and logging
- **Provide clear error messages** and fail gracefully

### 9. Project Workflow

- **Follow implementation plan workflow** for new features
- **Update progress tracking** after each implementation step

### 10. Verification

- **Always verify information** from context before presenting or acting on it
- **Do NOT make assumptions** without evidence in code or documentation

### 11. Simplicity First

- **Make every change as simple as possible** - complexity should be justified
- **Minimize impact radius** - each change should touch the fewest files
  possible
- **Incremental improvements** - prefer many small changes over one large change
- **Break down complex tasks** - split into smaller, manageable pieces
- **YAGNI principle** - You Aren't Gonna Need It - don't add functionality until
  necessary
- **Single responsibility per change** - each commit should do ONE thing well
- **Prefer modification over creation** - update existing code before creating
  new files
- **Stop and reassess if**:
  - A change touches more than 5 files
  - A function grows beyond 30 lines
  - You're adding more than 200 lines in one commit
  - You need to refactor before implementing the actual change

## 🏗️ **MODULARITY CHECKLIST** - VERIFY BEFORE EVERY COMMIT

### 1. Explicit Architectural Blueprints & Design

- [ ] **Detailed Modularity Prompts:** Are prompts explicitly requesting modular
      design with constraints for individual modules?
- [ ] **Interface Definition (API-First):** Have clear APIs/interface contracts
      (OpenAPI specs, function signatures) been defined for each module _before_
      generating full code?
- [ ] **Design Pattern Specification:** Are specific software design patterns
      being used to promote modularity (publish-subscribe, dependency
      injection)?
- [ ] **Security Architecture Planning:** Has security been designed into each
      module from the start (not bolted on)?

### 2. Architectural Style Guidance

- [ ] **Microservices/SOA Implementation:** Are distinct services developed as
      separate, independent components?
- [ ] **4-Layer Architecture Within Apps:** Are applications structured with
      distinct layers?
  - [ ] **Presentation Layer (UI):** Handles user interaction only
  - [ ] **Business Logic Layer:** Contains application-specific rules and
        workflows
  - [ ] **Data Access Layer:** Manages database/data store communication
  - [ ] **API Layer:** Exposes functionality to other internal services
- [ ] **Independent Components:** Are features broken into smaller components
      with well-defined responsibilities?
- [ ] **Event-Driven Patterns:** Are event-driven approaches used for loose
      coupling between services?

### 3. Standardization of Communication and Data

- [ ] **Inter-Service API-First Design:** Do services communicate only through
      well-documented APIs (no direct access)?
- [ ] **Internal Component Interfaces:** Are clear contracts defined between
      layers/components within apps?
- [ ] **Shared Libraries for Common Concerns:** Are core shared libraries being
      developed/utilized for auth, UI themes, cross-cutting concerns?
- [ ] **Component-Based UI Architecture:** Are reusable UI components developed
      for consistent theming?
- [ ] **Common Data Models:** Are standardized data formats (JSON schemas)
      defined and enforced for inter-service information exchange?
- [ ] **Centralized Authentication:** Is unified authentication implemented as
      shared service?

### 4. Human Oversight and Iterative Refinement

- [ ] **Human Architectural Oversight:** Has a human architect defined overall
      modular structure and interfaces?
- [ ] **Module-Specific AI Prompts:** Are AI agent prompts narrowly focused on
      specific modules/boundaries?
- [ ] **AI Agent Isolation:** Are AI agents prevented from accessing internals
      of modules they're not assigned to?
- [ ] **Modularity-Focused Code Reviews:** Is code being reviewed specifically
      for adherence to modular design, interface contracts, and separation of
      concerns?
- [ ] **AI-Assisted Refactoring:** Are specific prompts being used to refactor
      monolithic code into modular structures?
- [ ] **Iterative Modular Development:** Starting coarse, then iteratively
      refining modularity?
- [ ] **Task Decomposition:** Are complex development tasks broken down into
      smaller, focused assignments?

### 5. Tooling and Development Environment

- [ ] **Modular Version Control:** Are different modules managed with reinforced
      separation (separate directories, clear boundaries)?
- [ ] **Rigorous Testing Strategy:** Are comprehensive tests implemented?
  - [ ] **Unit Tests:** Individual modules/components tested in isolation
  - [ ] **Integration Tests:** Component interactions within apps tested
  - [ ] **Contract Tests:** Inter-service API communication verified
  - [ ] **Security Tests:** Penetration testing, vulnerability scanning,
        security audits
- [ ] **Automated Interface Testing:** Are automated tests implemented for each
      module, focusing on defined interfaces for independent functionality?
- [ ] **Minimize Direct Dependencies:** Do components interact only through
      declared interfaces?
- [ ] **Security Tooling Integration:** Dependency scanning, container scanning,
      SAST/DAST tools configured?

**🚨 CRITICAL: Review this checklist before every development session and
commit!**

## 📋 Template Development Standards

### When Working with This Template

1. **ALWAYS follow the microservices architecture** - services are independent
   with their own databases
2. **Use OpenAPI 3.0 specifications** before implementing any API
3. **Follow the monorepo structure** with Turborepo
4. **Implement structured logging** with correlation IDs
5. **Use TypeScript strictly** - no implicit any allowed
6. **Follow the service-oriented architecture** - independent services with
   dedicated databases

### Code Quality Requirements

- **ESLint & Prettier** must pass on all code
- **TypeScript compilation** must succeed without errors
- **OpenAPI specs** must be updated for API changes

### API Standards

- **REST endpoints** following `/api/v1/` pattern
- **JSON responses** with consistent structure
- **UUID identifiers** for all entities
- **ISO 8601 timestamps** in UTC
- **Structured error responses** with correlation IDs
- **Environment-aware configuration** - no hardcoded URLs/secrets
- **Security-first design** - authentication, rate limiting, input validation

### Database Standards

- **Service-specific databases** - never share databases between services
- **UUID primary keys** for all entities
- **Proper migrations** for schema changes
- **Seed data** for development environment
- **Environment-specific connection strings** - use config files/env vars
- **Security-first access** - encrypted connections, proper credentials
  management
- **No sensitive data in logs** - sanitize database error messages

### Security Standards - MANDATORY SECURITY REQUIREMENTS

- **Authentication & Authorization:**
  - JWT tokens with short expiration (15 min access, 7 day refresh)
  - Role-based access control (RBAC) with granular permissions
  - Multi-factor authentication (MFA) for admin accounts
  - Secure session management with httpOnly, secure, sameSite cookies
  - Account lockout after failed login attempts
- **Data Protection:**
  - Encrypt all PII/sensitive data at rest (AES-256)
  - TLS 1.3 for all data in transit
  - Database connection encryption
  - API key rotation and secure storage
  - Password hashing with bcrypt (cost factor ≥12)
- **Input Security:**
  - Validate and sanitize ALL user inputs
  - Parameterized queries only (prevent SQL injection)
  - Rate limiting on all API endpoints
  - CORS policy configuration
  - Content Security Policy (CSP) headers
- **Infrastructure Security:**
  - Environment variable security (never commit secrets)
  - Container security scanning
  - Dependency vulnerability scanning
  - Regular security updates
  - Network segmentation between services
- **Monitoring & Incident Response:**
  - Security event logging (authentication, authorization, data access)
  - Anomaly detection and alerting
  - Audit trails for all data modifications
  - Data breach notification procedures
  - Regular security assessments

### Frontend Standards

- **React with TypeScript** for all UIs
- **Shared component library** for consistency
- **Responsive design** always
- **Accessibility compliance** (WCAG 2.1)
- **Security-first frontend** - XSS prevention, secure storage, HTTPS only

## 🏗️ Template Architecture

### Current Template Structure

- **Multi-Tenancy System** - Flexible tenant resolution and resource isolation
- **Plugin Architecture** - Extensible system with marketplace support
- **Microservices Foundation** - Auth service, API Gateway, notification service
- **Shared Libraries** - Comprehensive set of reusable packages
- **Modern Frontend** - React with TypeScript and Tailwind CSS
- **Security Tools** - Comprehensive scanning and vulnerability management

### Key Features

1. **🔐 Enterprise Security** - JWT auth, RBAC, MFA, security scanning
2. **🏢 Multi-Tenancy** - Flexible tenant resolution, resource limits
3. **🔌 Plugin System** - Extensible architecture with marketplace
4. **⚡ Microservices** - Scalable service architecture
5. **🎨 Modern Frontend** - React with TypeScript and Tailwind
6. **🛠️ Developer Tools** - Code generators, testing, CI/CD
7. **📚 Comprehensive Docs** - Architecture, API reference, guides

## 🛠️ Development Commands

### Essential Commands

```bash
# Install dependencies
pnpm install

# Start all services in development
pnpm run dev

# Build all packages
pnpm run build

# Run all tests
pnpm test

# Lint and format code
pnpm run lint
pnpm run format

# Type check all packages
pnpm run typecheck
```

### Code Generation

```bash
# Generate new service
pnpm run generate:service my-service

# Generate new app
pnpm run generate:app my-app
```

### Security

```bash
# Run security scanning
./scripts/security-scan.sh
```

## 📚 Template Customization Guide

### For New Projects

1. **Clone the template**
2. **Update branding** - Replace "Enterprise SaaS Template" with your product
   name
3. **Configure multi-tenancy** - Set up tenant resolution strategy for your
   domain
4. **Customize authentication** - Configure OAuth providers, MFA settings
5. **Add business logic** - Create domain-specific services using generators
6. **Configure deployment** - Set up CI/CD for your infrastructure
7. **Security hardening** - Review and enhance security settings for your use
   case

### Package Namespacing

- All shared packages use `@template/*` namespace
- When customizing, consider updating to your organization namespace
- Update all import statements accordingly

## 🔧 Technology Stack

### Backend

- **Node.js + TypeScript** for all services
- **Express.js** for API frameworks
- **PostgreSQL** for primary databases
- **Redis** for caching
- **OpenAPI 3.0** for API documentation

### Frontend

- **React + TypeScript** for all UIs
- **Shared component library** with theming
- **React Query** for server state management
- **Tailwind CSS** for styling

### Infrastructure

- **Docker** for containerization
- **Turbo** for monorepo management
- **Security scanning** tools integrated

## 🚨 Important Template Notes

### What to ALWAYS Remember

- This is a **template** - customize for your domain
- Each service has its **own database** - never share databases
- Follow the **backend-first development approach**
- All APIs must have **OpenAPI 3.0 specifications**
- Use **structured logging** with correlation IDs
- Follow **TypeScript strict mode** - no any types allowed

### What to NEVER Do

- Don't create monolithic architectures
- Don't share databases between services
- Don't skip API documentation
- Don't use `any` types in TypeScript
- Don't break the service independence principle
- Don't implement features without tests
- **NEVER expose sensitive data** in logs, errors, or responses
- **NEVER commit secrets** to version control
- **NEVER skip input validation** on user data
- **NEVER use HTTP** - always HTTPS in production
- **NEVER trust client-side validation** alone

### When Making Changes

1. **Security review FIRST** - assess security implications
2. Update relevant documentation
3. Follow the established code patterns
4. Run quality checks before committing
5. Update OpenAPI specs for API changes
6. **Security verification** - dependency scan, input validation check

## 📞 Getting Help

### Template Documentation

- [Getting Started](./docs/GETTING_STARTED.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Security Guide](./docs/SECURITY.md)
- [Multi-Tenancy Guide](./libs/multi-tenancy/README.md)
- [Plugin System Guide](./libs/plugin-system/README.md)

### Common Template Issues

- **Build failures:** Check TypeScript configuration and package references
- **Test failures:** Verify test data and mocks
- **Import errors:** Check @template/\* package references
- **Security scan failures:** Review and fix flagged vulnerabilities
- **Multi-tenancy setup:** Check tenant resolution configuration

---

**Template Version:** 1.0.0 **Last Updated:** Template completion and Claude
guide integration **Next Steps:** Customize for your specific domain and
business requirements

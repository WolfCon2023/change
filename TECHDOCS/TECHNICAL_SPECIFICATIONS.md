# CHANGE Platform - Technical Specifications

**Version:** 0.1.0  
**Last Updated:** February 2026  
**Document Status:** Living Document

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture](#system-architecture)
3. [Technology Stack](#technology-stack)
4. [Project Structure](#project-structure)
5. [Backend API](#backend-api)
6. [Frontend Application](#frontend-application)
7. [Data Models](#data-models)
8. [Authentication & Authorization](#authentication--authorization)
9. [Admin Portal Features](#admin-portal-features)
10. [Compliance Features](#compliance-features)
11. [API Endpoints Reference](#api-endpoints-reference)
12. [Security Considerations](#security-considerations)
13. [Deployment](#deployment)

---

## Executive Summary

The CHANGE Platform is a comprehensive **Business Formation & Advisory System** with a full-featured **Identity and Access Management (IAM) Admin Portal**. The system is designed as a multi-tenant SaaS application supporting:

- Business entity formation workflows
- Client onboarding and enrollment management
- Document generation and management
- Task and checklist management
- Advisor oversight and client management
- Enterprise-grade IAM with RBAC
- Compliance-focused access reviews
- Security gap analysis

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CHANGE Platform                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐   │
│  │   Web Client    │     │    API Server   │     │    MongoDB      │   │
│  │   (React SPA)   │ ──► │   (Express.js)  │ ──► │   (Database)    │   │
│  │                 │     │                 │     │                 │   │
│  │  • React 18     │     │  • Node.js 20+  │     │  • Mongoose 8   │   │
│  │  • TypeScript   │     │  • TypeScript   │     │  • Multi-tenant │   │
│  │  • TailwindCSS  │     │  • JWT Auth     │     │  • Indexed      │   │
│  │  • TanStack Q   │     │  • Zod Valid.   │     │                 │   │
│  └─────────────────┘     └─────────────────┘     └─────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    Shared Package (@change/shared)              │   │
│  │  • Constants (Roles, Permissions, Statuses)                     │   │
│  │  • Types (TypeScript interfaces)                                │   │
│  │  • Validation Schemas                                           │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Architecture Principles

| Principle | Implementation |
|-----------|----------------|
| **Multi-tenancy** | All data is tenant-scoped with tenant isolation |
| **Role-Based Access Control** | Fine-grained IAM permissions system |
| **API-First** | RESTful API with standardized response format |
| **Type Safety** | End-to-end TypeScript with shared types |
| **Monorepo** | Turborepo-managed workspace structure |

---

## Technology Stack

### Backend (`@change/api`)

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 20+ | Runtime environment |
| **Express.js** | 4.18 | Web framework |
| **TypeScript** | 5.3 | Type-safe development |
| **MongoDB** | 8.x | Document database |
| **Mongoose** | 8.1 | ODM for MongoDB |
| **JWT** | 9.x | Authentication tokens |
| **bcryptjs** | 2.4 | Password hashing |
| **Zod** | 3.22 | Schema validation |
| **Helmet** | 7.1 | Security headers |
| **Morgan** | 1.10 | HTTP request logging |

### Frontend (`@change/web`)

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2 | UI framework |
| **TypeScript** | 5.3 | Type-safe development |
| **Vite** | 5.0 | Build tool and dev server |
| **TailwindCSS** | 3.4 | Utility-first CSS |
| **TanStack Query** | 5.17 | Server state management |
| **React Router** | 6.21 | Client-side routing |
| **Zustand** | 4.4 | Client state management |
| **React Hook Form** | 7.49 | Form handling |
| **Radix UI** | Various | Accessible UI primitives |
| **Lucide React** | 0.309 | Icon library |
| **Axios** | 1.6 | HTTP client |
| **date-fns** | 3.2 | Date utilities |

### Shared Package (`@change/shared`)

| Component | Purpose |
|-----------|---------|
| **Constants** | Enums, status values, permission definitions |
| **Types** | TypeScript interfaces shared across apps |
| **Schemas** | Validation schemas |

### Build & Development Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **Turborepo** | 2.0 | Monorepo build system |
| **Prettier** | 3.2 | Code formatting |
| **ESLint** | 8.56 | Code linting |
| **Husky** | 9.0 | Git hooks |
| **tsx** | 4.7 | TypeScript execution |
| **Vitest** | 1.2 | Unit testing |

---

## Project Structure

```
change/
├── apps/
│   ├── api/                          # Backend Express.js API
│   │   ├── src/
│   │   │   ├── config/               # Configuration
│   │   │   ├── db/
│   │   │   │   ├── connection.ts     # MongoDB connection
│   │   │   │   └── models/           # Mongoose models (20+ models)
│   │   │   ├── middleware/           # Express middleware
│   │   │   │   ├── auth.ts           # JWT authentication
│   │   │   │   ├── iam-auth.ts       # IAM permission checks
│   │   │   │   ├── tenant.ts         # Tenant context
│   │   │   │   └── validate.ts       # Request validation
│   │   │   ├── routes/
│   │   │   │   ├── admin/            # Admin portal routes
│   │   │   │   ├── auth.routes.ts    # Authentication
│   │   │   │   ├── health.routes.ts  # Health checks
│   │   │   │   └── tenant.routes.ts  # Tenant operations
│   │   │   ├── services/             # Business logic services
│   │   │   └── validators/           # Zod validation schemas
│   │   └── package.json
│   │
│   └── web/                          # Frontend React SPA
│       ├── src/
│       │   ├── components/
│       │   │   ├── admin/            # Admin-specific components
│       │   │   └── ui/               # Reusable UI components
│       │   ├── layouts/              # Page layouts
│       │   ├── lib/                  # Utilities and API hooks
│       │   ├── pages/
│       │   │   ├── admin/            # Admin portal pages (17 pages)
│       │   │   ├── auth/             # Authentication pages
│       │   │   └── dashboard/        # User dashboard
│       │   └── stores/               # Zustand state stores
│       └── package.json
│
├── packages/
│   └── shared/                       # Shared code package
│       └── src/
│           ├── constants/            # Enums and constants (1,400+ lines)
│           ├── types/                # TypeScript interfaces (1,300+ lines)
│           └── schemas/              # Validation schemas
│
├── docs/                             # Documentation
│   └── ADMIN_PORTAL_USER_GUIDE.md    # User guide (1,400+ lines)
│
├── TECHDOCS/                         # Technical documentation
│   ├── architecture.md
│   ├── roles-and-permissions.md
│   └── tenants.md
│
├── package.json                      # Root workspace config
├── turbo.json                        # Turborepo config
└── tsconfig.json                     # Root TypeScript config
```

---

## Backend API

### Database Models (20+ Mongoose Models)

| Model | Purpose | Key Fields |
|-------|---------|------------|
| **User** | User accounts | email, passwordHash, primaryRole, tenantId, mfaEnabled |
| **Tenant** | Organizations/companies | name, slug, settings, subscription |
| **IamRole** | Permission roles | name, permissions[], isSystem |
| **Group** | User groups | name, members[], roles[] |
| **AccessRequest** | Access request workflow | requestorId, requestedRoleIds, status |
| **AccessReview** | Periodic access reviews | name, status, dueAt, items |
| **AccessReviewItem** | Individual review items | userId, currentRoles, decision |
| **AccessReviewCampaign** | Comprehensive review campaigns | subjects[], status, approvals |
| **ApiKey** | API credentials | keyHash, scopes[], expiresAt |
| **AdvisorAssignment** | Advisor-tenant mapping | advisorId, tenantId, status |
| **IamAuditLog** | IAM activity audit | action, actorId, targetId, before, after |
| **AuditLog** | General audit trail | action, resourceType, resourceId |
| **BusinessProfile** | Business entity details | businessName, businessType, formationState |
| **Person** | Business members/officers | firstName, lastName, roles[] |
| **Enrollment** | Program enrollment | cohortId, status, advisorId |
| **Cohort** | Program cohorts | name, status, advisorIds[] |
| **WorkflowInstance** | Formation workflow state | currentPhase, stepData |
| **Task** | Task items | title, status, priority, dueDate |
| **DocumentTemplate** | Document templates | type, content, mergeFields[] |
| **DocumentInstance** | Generated documents | templateId, status, content |
| **ServiceAccount** | Service accounts | name, roles[], status |
| **TenantSettings** | Tenant configuration | security settings |

### Middleware Stack

```typescript
// Request processing pipeline
app.use(helmet());              // Security headers
app.use(cors());                // CORS handling
app.use(compression());         // Response compression
app.use(morgan('combined'));    // Request logging
app.use(express.json());        // JSON body parsing
app.use(rateLimit());           // Rate limiting

// Route-level middleware
authenticate                    // JWT validation
loadIamPermissions             // Load user's permissions
requirePermission(perm)        // Check specific permission
requireAnyPermission(...perms) // Check any permission
tenantContext                  // Set tenant context
validate(schema)               // Zod schema validation
```

### API Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    validationErrors?: ValidationError[];
  };
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: PaginationMeta;
  };
}
```

---

## Frontend Application

### Application Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/login` | LoginPage | Public |
| `/register` | RegisterPage | Public |
| `/dashboard` | DashboardPage | Authenticated |
| `/profile` | ProfilePage | Authenticated |
| `/admin` | AdminDashboardPage | Admin Portal |
| `/admin/users` | UsersPage | IAM_USER_READ |
| `/admin/roles` | RolesPage | IAM_ROLE_READ |
| `/admin/groups` | GroupsPage | IAM_GROUP_READ |
| `/admin/advisor-assignments` | AdvisorAssignmentsPage | IT_ADMIN only |
| `/admin/access-requests` | AccessRequestsPage | IAM_ACCESS_REQUEST_READ |
| `/admin/api-keys` | ApiKeysPage | IAM_API_KEY_READ |
| `/admin/audit-logs` | AuditLogsPage | IAM_AUDIT_READ |
| `/admin/access-reviews` | AccessReviewsPage | IAM_ACCESS_REVIEW_READ |
| `/admin/access-review-campaigns` | AccessReviewCampaignsPage | IAM_ACCESS_REVIEW_READ |
| `/admin/access-review-campaigns/new` | AccessReviewCampaignWizardPage | IAM_ACCESS_REVIEW_WRITE |
| `/admin/access-review-campaigns/:id` | AccessReviewCampaignDetailPage | IAM_ACCESS_REVIEW_READ |
| `/admin/security-gaps` | SecurityGapAnalysisPage | IAM_AUDIT_READ |
| `/admin/governance` | GovernancePage | All admin users |
| `/admin/knowledge-base` | KnowledgeBasePage | All admin users |

### State Management

**Authentication Store (Zustand)**
```typescript
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login(email: string, password: string): Promise<void>;
  logout(): void;
  refreshToken(): Promise<void>;
}
```

**Admin Store (Zustand)**
```typescript
interface AdminState {
  permissions: Set<IamPermissionType>;
  roles: IamRole[];
  currentTenantId: string | null;
  primaryRole: PrimaryRoleType;
  hasPermission(permission: IamPermissionType): boolean;
  setContext(context: AdminContext): void;
}
```

### UI Components Library

| Component | Source | Purpose |
|-----------|--------|---------|
| Button | Radix + Tailwind | Action buttons with variants |
| Card | Radix + Tailwind | Content containers |
| Input | Radix + Tailwind | Form inputs |
| Select | Radix | Dropdown selection |
| Tabs | Radix | Tab navigation |
| Badge | Custom | Status indicators |
| Toast | Radix | Notifications |
| DataTable | Custom | Data display with sorting/filtering |
| PermissionGate | Custom | Conditional rendering by permission |

---

## Data Models

### User Model

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  primaryRole: 'it_admin' | 'manager' | 'advisor' | 'customer';
  tenantId?: string;
  isActive: boolean;
  
  // IAM Fields
  mfaEnabled: boolean;
  mfaEnforced: boolean;
  iamRoles: string[];      // Role IDs
  groups: string[];        // Group IDs
  lockedAt?: Date;
  lockReason?: string;
  failedLoginAttempts: number;
  passwordChangedAt?: Date;
  mustChangePassword: boolean;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
}
```

### Access Review Campaign Model

```typescript
interface AccessReviewCampaign {
  id: string;
  tenantId: string;
  
  // Campaign Info
  name: string;
  description?: string;
  systemName: string;
  environment: 'prod' | 'uat' | 'dev';
  businessUnit?: string;
  
  // Review Configuration
  reviewType: 'periodic' | 'event_driven' | 'role_change' | 'termination' | 'compliance';
  periodStart: Date;
  periodEnd: Date;
  reviewerType: 'manager' | 'app_owner' | 'it_admin' | 'compliance';
  
  // Status
  status: 'draft' | 'in_review' | 'submitted' | 'completed';
  
  // Nested Documents
  subjects: AccessReviewCampaignSubject[];
  approvals?: AccessReviewCampaignApprovals;
  workflow?: AccessReviewCampaignWorkflow;
  groupCertifications?: GroupCertification[];
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  completedAt?: Date;
}
```

---

## Authentication & Authorization

### Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │     │   API       │     │   Database  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       │ POST /auth/login  │                   │
       │──────────────────►│                   │
       │                   │ Find user by email│
       │                   │──────────────────►│
       │                   │◄──────────────────│
       │                   │                   │
       │                   │ Verify password   │
       │                   │ (bcrypt compare)  │
       │                   │                   │
       │                   │ Generate JWT      │
       │                   │ (access + refresh)│
       │                   │                   │
       │ { tokens, user }  │                   │
       │◄──────────────────│                   │
       │                   │                   │
```

### JWT Token Structure

```typescript
interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRoleType;
  tenantId?: string;
  iat: number;        // Issued at
  exp: number;        // Expiration
}
```

### Primary Roles (4-Role Model)

| Role | Description | Tenant Access |
|------|-------------|---------------|
| **IT_ADMIN** | Full platform access, all IAM permissions | Cross-tenant (all tenants) |
| **MANAGER** | Tenant admin, limited IAM, full operational | Own tenant only |
| **ADVISOR** | Advisory access to assigned tenants | Assigned tenants only |
| **CUSTOMER** | End user, own tenant operations | Own tenant only |

### IAM Permissions (32 Permissions)

**Permission Categories:**

| Category | Permissions |
|----------|-------------|
| **User Management** | IAM_USER_READ, IAM_USER_WRITE, IAM_USER_DELETE, IAM_USER_INVITE, IAM_USER_RESET_PASSWORD |
| **Role Management** | IAM_ROLE_READ, IAM_ROLE_WRITE, IAM_ROLE_DELETE, IAM_ROLE_ASSIGN |
| **Group Management** | IAM_GROUP_READ, IAM_GROUP_WRITE, IAM_GROUP_DELETE, IAM_GROUP_MANAGE_MEMBERS |
| **Access Requests** | IAM_ACCESS_REQUEST_READ, IAM_ACCESS_REQUEST_APPROVE, IAM_ACCESS_REQUEST_CREATE |
| **API Keys** | IAM_API_KEY_READ, IAM_API_KEY_WRITE, IAM_API_KEY_REVOKE, IAM_SERVICE_ACCOUNT_READ, IAM_SERVICE_ACCOUNT_WRITE |
| **Audit** | IAM_AUDIT_READ, IAM_AUDIT_EXPORT |
| **Access Reviews** | IAM_ACCESS_REVIEW_READ, IAM_ACCESS_REVIEW_WRITE, IAM_ACCESS_REVIEW_DECIDE |
| **Policy** | IAM_POLICY_READ, IAM_POLICY_WRITE, IAM_SETTINGS_READ, IAM_SETTINGS_WRITE |
| **Tenant** | IAM_TENANT_READ, IAM_TENANT_WRITE, IAM_CROSS_TENANT |

### Permission Enforcement

```typescript
// Route-level permission check
router.get(
  '/users',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_USER_READ),
  async (req, res) => { /* ... */ }
);

// Frontend permission gate
<PermissionGate permission={IamPermission.IAM_USER_WRITE}>
  <Button>Create User</Button>
</PermissionGate>
```

---

## Admin Portal Features

### 1. Dashboard
- Total users, active users, locked accounts
- MFA coverage percentage
- Pending access requests count
- Open access reviews count
- Users without MFA list
- Expiring API keys alerts

### 2. User Management
- User list with search and filters
- Create, edit, deactivate users
- Role and group assignment
- MFA enable/disable
- Account lock/unlock
- Password reset

### 3. Role Management
- Custom role creation
- Permission assignment
- System roles (read-only)
- Role hierarchy

### 4. Group Management
- Group creation and management
- Member management
- Role assignment to groups
- Inherited permissions

### 5. Access Requests
- Request workflow (pending → approved/rejected)
- Time-limited access support
- Approval with notes
- Request history

### 6. API Keys
- Key generation with permissions
- Key rotation
- Expiration management
- Usage tracking

### 7. Audit Logs
- Comprehensive IAM activity logging
- Filterable by actor, action, date
- Export capability
- 7-year retention (production)

### 8. Access Reviews
- Create reviews for user access validation
- Decision options: Keep, Remove, Change
- Completion tracking
- Closure with summary

### 9. Access Review Campaigns
- **Campaign Wizard**: 5-step creation process
- **Subject Management**: Manual or bulk user selection
- **Access Items**: Role, permission, application access
- **Group Certification**: Membership and permission review
- **Bulk Actions**: Approve standard, approve all, approve selected
- **Smart Suggestions**: AI-powered review recommendations
- **Workflow Tracking**: Due dates, escalation, remediation
- **Approval Process**: First and second-level approval
- **Compliance Integration**: Regulated flags (SOX, PCI, HIPAA, etc.)

### 10. Security Gap Analysis
- **Security Score**: 0-100 composite score
- **Gap Categories**: Authentication, Access Management, Privilege Management, API Security, Compliance
- **Gap Detection**:
  - Users without MFA
  - Inactive user accounts
  - Excessive administrative access
  - API key management issues
  - No recent access reviews
  - Users without group membership
  - Separation of duties violations
- **Compliance Framework Mapping**: SOC2, ISO 27001, NIST 800-53, PCI-DSS
- **Remediation Guidance**: Step-by-step fix instructions

### 11. Governance
- SIPOC alignment (Suppliers, Inputs, Process, Outputs, Customers)
- DMAIC framework mapping (Define, Measure, Analyze, Improve, Control)
- CHANGE methodology phase gates

### 12. Knowledge Base
- Interactive user guide with 17 sections
- Compliance framework reference
- Glossary of IAM terms
- Troubleshooting guide
- Searchable table of contents
- Print functionality

---

## Compliance Features

### Supported Compliance Frameworks

| Framework | Key Controls Addressed |
|-----------|----------------------|
| **SOC 2** | CC6.1 (Logical access), CC6.2 (Authorization), CC6.3 (Access removal), CC6.6 (System boundaries), CC7.2 (Monitoring) |
| **ISO 27001** | A.9.2.1 (User registration), A.9.2.3 (Privileged access), A.9.2.5 (Access rights review), A.9.4.2 (Secure log-on), A.12.4.2 (Log protection) |
| **NIST 800-53** | AC-2 (Account management), AC-5 (Separation of duties), AC-6 (Least privilege), IA-2 (Identification and authentication), AU-2 (Audit events) |
| **PCI-DSS** | 7.1 (Limit access by job), 7.1.2 (Privileged access), 8.1 (User identification), 8.3 (MFA), 10.2 (Audit trails) |

### Compliance Features Summary

- **Quarterly Access Reviews**: Scheduled campaign support
- **Audit Trail**: 7-year retention with tamper-evident storage
- **MFA Enforcement**: Per-user and tenant-wide options
- **Separation of Duties**: Permission conflict detection
- **Access Certification**: Annual certification workflow
- **Privileged Access Monitoring**: Admin access tracking
- **API Key Rotation**: Expiration and rotation policies

---

## API Endpoints Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Authenticate user |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Invalidate session |

### Admin - Context

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/me` | Get current user context, permissions |
| GET | `/api/v1/admin/tenants/:tenantId/dashboard` | Get IAM dashboard stats |
| GET | `/api/v1/admin/permissions` | Get all available permissions |

### Admin - Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/tenants/:tenantId/users` | List users |
| POST | `/api/v1/admin/tenants/:tenantId/users` | Create user |
| GET | `/api/v1/admin/tenants/:tenantId/users/:id` | Get user details |
| PUT | `/api/v1/admin/tenants/:tenantId/users/:id` | Update user |
| DELETE | `/api/v1/admin/tenants/:tenantId/users/:id` | Deactivate user |
| POST | `/api/v1/admin/tenants/:tenantId/users/:id/lock` | Lock user account |
| POST | `/api/v1/admin/tenants/:tenantId/users/:id/unlock` | Unlock user account |

### Admin - Roles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/tenants/:tenantId/roles` | List roles |
| POST | `/api/v1/admin/tenants/:tenantId/roles` | Create role |
| PUT | `/api/v1/admin/tenants/:tenantId/roles/:id` | Update role |
| DELETE | `/api/v1/admin/tenants/:tenantId/roles/:id` | Delete role |

### Admin - Groups

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/tenants/:tenantId/groups` | List groups |
| POST | `/api/v1/admin/tenants/:tenantId/groups` | Create group |
| PUT | `/api/v1/admin/tenants/:tenantId/groups/:id` | Update group |
| DELETE | `/api/v1/admin/tenants/:tenantId/groups/:id` | Delete group |
| POST | `/api/v1/admin/tenants/:tenantId/groups/:id/members` | Manage members |
| POST | `/api/v1/admin/tenants/:tenantId/groups/:id/roles` | Manage roles |

### Admin - Access Requests

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/tenants/:tenantId/access-requests` | List requests |
| POST | `/api/v1/admin/tenants/:tenantId/access-requests` | Create request |
| POST | `/api/v1/admin/tenants/:tenantId/access-requests/:id/decide` | Approve/reject |

### Admin - API Keys

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/tenants/:tenantId/api-keys` | List API keys |
| POST | `/api/v1/admin/tenants/:tenantId/api-keys` | Create API key |
| POST | `/api/v1/admin/tenants/:tenantId/api-keys/:id/revoke` | Revoke API key |

### Admin - Audit Logs

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/tenants/:tenantId/audit-logs` | List audit logs |
| GET | `/api/v1/admin/tenants/:tenantId/audit-logs/export` | Export audit logs |

### Admin - Access Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/tenants/:tenantId/access-reviews` | List reviews |
| POST | `/api/v1/admin/tenants/:tenantId/access-reviews` | Create review |
| GET | `/api/v1/admin/tenants/:tenantId/access-reviews/:id/items` | Get review items |
| POST | `/api/v1/admin/tenants/:tenantId/access-reviews/:id/items/:itemId/decide` | Make decision |
| POST | `/api/v1/admin/tenants/:tenantId/access-reviews/:id/close` | Close review |

### Admin - Access Review Campaigns

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/tenants/:tenantId/access-review-campaigns` | List campaigns |
| POST | `/api/v1/admin/tenants/:tenantId/access-review-campaigns` | Create campaign |
| GET | `/api/v1/admin/tenants/:tenantId/access-review-campaigns/:id` | Get campaign |
| PUT | `/api/v1/admin/tenants/:tenantId/access-review-campaigns/:id` | Update campaign |
| POST | `/api/v1/admin/tenants/:tenantId/access-review-campaigns/:id/submit` | Submit for review |
| POST | `/api/v1/admin/tenants/:tenantId/access-review-campaigns/:id/approve` | Approve campaign |
| GET | `/api/v1/admin/tenants/:tenantId/access-review-campaigns/suggestions` | Get smart suggestions |
| POST | `/api/v1/admin/tenants/:tenantId/access-review-campaigns/bulk-decision` | Bulk decisions |

### Admin - Security Gaps

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/tenants/:tenantId/security-gaps` | Get security analysis |

### Admin - Advisor Assignments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/advisor-assignments` | List assignments |
| POST | `/api/v1/admin/advisor-assignments` | Create assignment |
| DELETE | `/api/v1/admin/advisor-assignments/:id` | Remove assignment |

---

## Security Considerations

### Password Security
- bcrypt hashing with 12 rounds
- Minimum 8 characters
- Complexity requirements (uppercase, lowercase, number, special)
- Password expiry support

### API Security
- JWT with short expiration (15 min access, 7 day refresh)
- Rate limiting on authentication endpoints
- Helmet.js security headers
- CORS configuration
- API key scoping

### Data Protection
- Sensitive fields excluded from queries by default
- Password hash never returned in API responses
- MFA secret encrypted storage
- Tenant isolation at query level

### Session Security
- Account lockout after failed attempts
- Session timeout configuration
- Forced logout capability

---

## Deployment

### Environment Requirements

```bash
# Node.js version
node >= 20.0.0
npm >= 10.0.0

# Environment Variables (API)
DATABASE_URL=mongodb+srv://...
JWT_SECRET=<secure-secret>
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
PORT=3000
NODE_ENV=production

# Environment Variables (Web)
VITE_API_URL=https://api.example.com
```

### Build Commands

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Build specific workspace
npm run build --workspace=@change/api
npm run build --workspace=@change/web

# Run development
npm run dev

# Database seed
npm run db:seed
```

### Production Deployment

- **API**: Railway, Render, or similar Node.js hosting
- **Web**: Vercel, Netlify, or static hosting
- **Database**: MongoDB Atlas (recommended)

---

## Summary Statistics

| Metric | Count |
|--------|-------|
| **Mongoose Models** | 20+ |
| **API Endpoints** | 50+ |
| **Frontend Pages** | 17 |
| **Shared Constants** | 1,400+ lines |
| **Shared Types** | 1,300+ lines |
| **IAM Permissions** | 32 |
| **Compliance Frameworks** | 4 |
| **Security Gap Types** | 7 |
| **Documentation** | 3,000+ lines |

---

*This document is maintained as part of the CHANGE Platform technical documentation. For user-facing documentation, see the Knowledge Base in the Admin Portal or `docs/ADMIN_PORTAL_USER_GUIDE.md`.*

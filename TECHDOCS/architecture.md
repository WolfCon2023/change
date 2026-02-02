# CHANGE Platform Architecture

## Overview

The CHANGE Platform is a multi-tenant SaaS application for managing organizational change and consulting engagements.

## Tech Stack

### Frontend
- **React** with TypeScript
- **Vite** for build tooling
- **React Router** for navigation
- **React Query** (TanStack Query) for data fetching and caching
- **Zustand** for global state management
- **Tailwind CSS** for styling

### Backend
- **Node.js** with Express
- **TypeScript**
- **MongoDB** with Mongoose ODM
- **JWT** for authentication (access tokens + refresh tokens)
- **bcrypt** for password hashing
- **Zod** for input validation

### Shared
- **@change/shared** package containing:
  - TypeScript types and interfaces
  - Zod validation schemas
  - Constants (roles, permissions, enums)

### Deployment
- **Railway** for hosting (API, Web, MongoDB)

---

## Project Structure

```
change/
├── apps/
│   ├── api/                    # Backend Express API
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   └── models/     # Mongoose models
│   │   │   ├── middleware/     # Express middleware
│   │   │   ├── routes/         # API routes
│   │   │   │   └── admin/      # Admin portal routes
│   │   │   ├── services/       # Business logic services
│   │   │   └── scripts/        # Utility scripts (seed, etc.)
│   │   └── dist/               # Compiled output
│   │
│   └── web/                    # Frontend React app
│       ├── src/
│       │   ├── components/     # Reusable components
│       │   │   ├── ui/         # Base UI components
│       │   │   └── admin/      # Admin-specific components
│       │   ├── layouts/        # Page layouts
│       │   ├── lib/            # Utilities and API clients
│       │   ├── pages/          # Page components
│       │   │   ├── admin/      # Admin portal pages
│       │   │   ├── auth/       # Authentication pages
│       │   │   └── dashboard/  # User dashboard pages
│       │   └── stores/         # Zustand stores
│       └── dist/               # Built output
│
├── packages/
│   └── shared/                 # Shared types and constants
│       └── src/
│           ├── constants/      # Enums, permission catalogs
│           ├── schemas/        # Zod validation schemas
│           └── types/          # TypeScript interfaces
│
└── TECHDOCS/                   # Technical documentation
```

---

## Data Flow

### Authentication Flow

```
1. User submits credentials
   └─> POST /api/v1/auth/login

2. Server validates credentials
   └─> Returns: { accessToken, user }
   └─> Sets: httpOnly refresh token cookie

3. Frontend stores accessToken in memory
   └─> Zustand auth store

4. Subsequent requests include Authorization header
   └─> Bearer <accessToken>

5. Token refresh (when access token expires)
   └─> POST /api/v1/auth/refresh
   └─> Uses httpOnly cookie
```

### API Request Flow

```
Request
  │
  ▼
Express Router
  │
  ▼
authenticate middleware
  │ (validates JWT, sets req.user)
  ▼
loadIamPermissions middleware
  │ (loads user's permissions, sets req.iamPermissions)
  ▼
requirePermission middleware (optional)
  │ (checks if user has required permission)
  ▼
requireTenantAccess middleware (optional)
  │ (validates user can access requested tenant)
  ▼
validate middleware (optional)
  │ (validates request body with Zod)
  ▼
Route Handler
  │
  ▼
Response
```

---

## Key Models

### Core Entities

```
User
├── email, firstName, lastName
├── primaryRole (it_admin, manager, advisor, customer)
├── tenantId (null for platform users)
├── iamRoles[] (legacy, for fine-grained permissions)
├── groups[]
└── authentication fields (passwordHash, mfaEnabled, etc.)

Tenant
├── name, slug
├── isActive
└── settings

IamRole
├── name, description
├── tenantId (null for system roles)
├── permissions[]
├── isSystem (true for the 4 primary roles)
└── systemRole (it_admin, manager, advisor, customer)

Group
├── name, description
├── tenantId (null for platform groups)
├── isPlatformGroup
├── members[] (user IDs)
└── roles[] (role IDs)

AdvisorAssignment
├── advisorId
├── tenantId
├── status, isActive
├── isPrimary
└── assignedAt, unassignedAt
```

### Audit and Compliance

```
IamAuditLog
├── tenantId
├── actorId, actorEmail
├── action (e.g., 'iam.user.created')
├── targetType, targetId
├── summary
├── before, after (state snapshots)
├── ip, userAgent
└── createdAt

AccessRequest
├── tenantId
├── requestorId
├── requestedRoleIds, requestedPermissions
├── status (pending, approved, rejected, expired)
└── approverId, decidedAt

AccessReview
├── tenantId
├── name, status
├── dueAt
└── items[] (AccessReviewItem)
```

---

## API Structure

### Public Routes
```
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/health
```

### Protected Routes (require authentication)
```
GET  /api/v1/users/me
PUT  /api/v1/users/me
```

### Admin Routes (require IAM permissions)
```
GET  /api/v1/admin/me

# Tenant-scoped routes
GET  /api/v1/admin/tenants/:tenantId/dashboard
GET  /api/v1/admin/tenants/:tenantId/users
POST /api/v1/admin/tenants/:tenantId/users
PUT  /api/v1/admin/tenants/:tenantId/users/:userId
...

# Platform routes (IT Admin only)
GET  /api/v1/admin/advisor-assignments
POST /api/v1/admin/advisor-assignments
GET  /api/v1/admin/advisors
GET  /api/v1/admin/tenants-list
```

---

## Security Model

### Authentication
- JWT access tokens (short-lived, ~15 minutes)
- Refresh tokens (httpOnly cookies, ~7 days)
- Password hashing with bcrypt (12 rounds)
- Optional MFA enforcement

### Authorization
- Role-based access control (RBAC)
- Permission-based checks on API endpoints
- Tenant isolation at query level
- Privilege escalation prevention

### Audit
- All IAM actions logged with before/after state
- IP and user agent tracking
- Exportable audit logs (CSV)
- Access reviews for compliance

---

## Environment Variables

### API Service
```
NODE_ENV=production
PORT=8080
MONGODB_URI=mongodb://...
JWT_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
CORS_ORIGIN=https://changeweb-production.up.railway.app
```

### Web Service
```
VITE_API_URL=https://changeapi-production.up.railway.app/api/v1
```

---

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        Railway                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────┐  │
│  │   Web App    │    │   API App    │    │ MongoDB  │  │
│  │   (Vite)     │───▶│  (Express)   │───▶│          │  │
│  │              │    │              │    │          │  │
│  └──────────────┘    └──────────────┘    └──────────┘  │
│         │                   │                           │
│         │                   │                           │
│  changeweb-prod...   changeapi-prod...                 │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

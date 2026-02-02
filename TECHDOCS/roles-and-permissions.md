# Roles and Permissions

## Overview

The CHANGE Platform uses a simplified Role-Based Access Control (RBAC) model with four primary roles designed for clarity and security.

## The Four Primary Roles

### 1. IT Admin (`it_admin`)

**Purpose**: Platform-wide administration and IAM management

**Scope**: All tenants (platform-level)

**Permissions**:
- `iam.user.read` - View all users
- `iam.user.write` - Create, update, delete users
- `iam.role.read` - View roles
- `iam.role.manage` - Create, update, delete roles
- `iam.group.read` - View groups
- `iam.group.manage` - Create, update, delete groups
- `iam.policy.manage` - Manage IAM policies
- `iam.audit.read` - View audit logs
- `iam.audit.export` - Export audit logs
- `iam.access_review.read` - View access reviews
- `iam.access_review.manage` - Manage access reviews
- `iam.api_key.read` - View API keys
- `iam.api_key.manage` - Create, revoke API keys
- `iam.access_request.read` - View access requests
- `iam.access_request.manage` - Approve/reject access requests

**Can**:
- Access any tenant
- Manage all IAM settings
- Assign any role to any user
- Create and manage advisor assignments

**Cannot**:
- Remove themselves as the last IT Admin (safety check)

---

### 2. Manager (`manager`)

**Purpose**: Tenant-level user management and operations

**Scope**: Single tenant only

**Permissions**:
- `users.invite` - Invite new users to their tenant
- `users.read` - View users in their tenant
- `users.update` - Update users in their tenant
- `tasks.read` - View tasks
- `tasks.manage` - Create, update tasks
- `documents.read` - View documents
- `documents.upload` - Upload documents
- `dashboards.read` - View dashboards
- `reports.read` - View reports

**Can**:
- Invite users to their tenant
- Assign CUSTOMER or MANAGER roles within their tenant
- Manage day-to-day operations

**Cannot**:
- Access other tenants
- Assign IT_ADMIN or ADVISOR roles
- Manage IAM settings (roles, permissions, policies)
- Export audit logs

---

### 3. Advisor (`advisor`)

**Purpose**: Consulting and oversight across assigned tenants

**Scope**: Assigned tenants only (via Advisor Assignments)

**Permissions**:
- `customers.read` - View customer information (assigned tenants only)
- `tasks.read` - View tasks
- `tasks.approve` - Approve tasks/milestones
- `documents.read` - View documents
- `documents.approve` - Approve documents
- `dashboards.read` - View dashboards
- `reports.read` - View reports

**Can**:
- Access tenants they are assigned to
- View and approve work
- Monitor progress across multiple clients

**Cannot**:
- Access tenants they are not assigned to
- Manage users or IAM settings
- Invite new users

---

### 4. Customer (`customer`)

**Purpose**: End-user within a tenant organization

**Scope**: Single tenant only (their own)

**Permissions**:
- `onboarding.read` - View onboarding information
- `onboarding.update` - Update onboarding information
- `tasks.read` - View assigned tasks
- `tasks.update` - Update task status
- `documents.read` - View documents
- `documents.upload` - Upload documents
- `dashboards.read` - View dashboards

**Can**:
- View and interact with their own tenant's data
- Complete assigned tasks
- Upload documents

**Cannot**:
- Access other tenants
- Manage users
- Manage IAM settings

---

## Role Hierarchy and Assignment Rules

### Who Can Assign Roles?

| Assigner Role | Can Assign |
|---------------|------------|
| IT Admin | Any role (IT_ADMIN, MANAGER, ADVISOR, CUSTOMER) |
| Manager | CUSTOMER, MANAGER (within their tenant only) |
| Advisor | Cannot assign roles |
| Customer | Cannot assign roles |

### Privilege Escalation Prevention

The system enforces these rules to prevent privilege escalation:

1. **Managers cannot assign IT_ADMIN or ADVISOR** - These are platform-level roles
2. **Users cannot modify their own role** - Prevents self-elevation
3. **Last IT Admin protection** - Cannot remove the last IT_ADMIN from the system
4. **Advisors must be assigned** - Cannot access tenants without explicit assignment

---

## Permission Categories

### IAM Permissions (IT Admin only)
```
iam.user.read
iam.user.write
iam.role.read
iam.role.manage
iam.group.read
iam.group.manage
iam.policy.manage
iam.audit.read
iam.audit.export
iam.access_review.read
iam.access_review.manage
iam.api_key.read
iam.api_key.manage
iam.access_request.read
iam.access_request.manage
```

### Operational Permissions
```
users.invite
users.read
users.update
customers.read
tasks.read
tasks.manage
tasks.update
tasks.approve
documents.read
documents.upload
documents.approve
dashboards.read
reports.read
onboarding.read
onboarding.update
```

---

## Implementation Details

### User Model

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  primaryRole: 'it_admin' | 'manager' | 'advisor' | 'customer';
  tenantId?: string;  // null for platform-level users
  isActive: boolean;
  // ...
}
```

### Checking Permissions in Code

**Backend (Express middleware)**:
```typescript
// Require specific permission
router.get('/users', requirePermission(IamPermission.IAM_USER_READ), handler);

// Require any of multiple permissions
router.get('/data', requireAnyPermission(
  IamPermission.IAM_AUDIT_READ,
  IamPermission.IAM_USER_READ
), handler);
```

**Frontend (React component)**:
```tsx
// Permission-based gate
<PermissionGate permission={IamPermission.IAM_USER_WRITE}>
  <Button>Create User</Button>
</PermissionGate>

// Role-based gate
<PermissionGate role={PrimaryRole.IT_ADMIN}>
  <AdminOnlyFeature />
</PermissionGate>
```

---

## Admin Portal Access by Role

| Page | IT Admin | Manager | Advisor | Customer |
|------|----------|---------|---------|----------|
| Dashboard | Yes | Yes | Yes | Yes |
| Users | Yes | Yes (own tenant) | No | No |
| Roles | Yes | View only | No | No |
| Groups | Yes | View only | No | No |
| Advisor Assignments | Yes | No | No | No |
| Access Requests | Yes | Yes | No | No |
| API Keys | Yes | Yes | No | No |
| Audit Logs | Yes | No | No | No |
| Access Reviews | Yes | No | No | No |

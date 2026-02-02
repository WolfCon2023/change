# Tenants in the CHANGE Platform

## What is a Tenant?

In the CHANGE Platform, a **tenant** represents a separate customer organization or business that uses the platform.

## Multi-Tenancy Explained

Think of it like an apartment building:
- The **platform** is the building
- Each **tenant** is a separate apartment
- Each apartment has its own residents (users), furniture (data), and rules

## In the CHANGE Platform Specifically

A tenant is typically a **customer company** going through your consulting/change management process. Each tenant has:

- **Their own users** - Customers, managers within that organization
- **Their own data** - Documents, tasks, milestones, etc.
- **Isolation** - One tenant cannot see another tenant's data

## Tenant Data Model

```typescript
interface Tenant {
  id: string;
  name: string;           // Display name (e.g., "Acme Corporation")
  slug: string;           // URL-friendly identifier (e.g., "acme-corp")
  isActive: boolean;      // Whether the tenant is active
  settings: object;       // Tenant-specific configuration
  createdAt: Date;
  updatedAt: Date;
}
```

## The Four Roles and Tenants

| Role | Tenant Relationship | Description |
|------|---------------------|-------------|
| **Customer** | Belongs to ONE tenant | Can only see their own tenant's data |
| **Manager** | Belongs to ONE tenant | Manages users within that tenant |
| **Advisor** | Platform-level | Can be ASSIGNED to multiple tenants |
| **IT Admin** | Platform-level | Can access ALL tenants |

## Role Access Patterns

### Tenant-Scoped Users (Customer, Manager)
- Have a `tenantId` field on their user record
- Can only access resources within their tenant
- Cannot see or interact with other tenants

### Platform-Level Users (Advisor, IT Admin)
- Do NOT have a `tenantId` (or it's null)
- **IT Admin**: Has implicit access to all tenants
- **Advisor**: Must be explicitly assigned to tenants via Advisor Assignments

## Advisor Assignments

Since Advisors (consultants) work with multiple customer organizations:
- They don't "belong" to a single tenant
- Instead, they get **assigned** to specific tenants they're working with
- The Advisor Assignments feature lets IT Admins control which advisors can access which customer tenants

### Advisor Assignment Data Model

```typescript
interface AdvisorAssignment {
  id: string;
  advisorId: string;      // Reference to User with ADVISOR role
  tenantId: string;       // Reference to Tenant
  status: 'active' | 'inactive' | 'pending';
  isActive: boolean;
  isPrimary: boolean;     // Is this the primary advisor for the tenant?
  notes?: string;
  assignedAt: Date;
  unassignedAt?: Date;
  createdBy?: string;
}
```

## Example Platform Structure

```
Platform: CHANGE
├── Tenant: "Acme Corp" (a customer company)
│   ├── Users: john@acme.com (Customer), jane@acme.com (Manager)
│   └── Data: Acme's tasks, documents, milestones
│
├── Tenant: "Beta Inc" (another customer company)
│   ├── Users: bob@beta.com (Customer)
│   └── Data: Beta's tasks, documents, milestones
│
└── Platform Users (no specific tenant):
    ├── admin@change.com (IT Admin) - can access everything
    └── advisor@change.com (Advisor) - assigned to Acme and Beta
```

## Tenant Isolation in Code

All database queries for tenant-scoped resources include a `tenantId` filter:

```typescript
// Example: Getting users for a tenant
const users = await User.find({ tenantId: req.params.tenantId });

// Example: Creating a document scoped to a tenant
const document = await Document.create({
  tenantId: req.params.tenantId,
  name: 'Project Plan',
  // ...
});
```

## API Routes and Tenants

Most admin API routes are scoped by tenant:

```
GET  /api/v1/admin/tenants/:tenantId/users
POST /api/v1/admin/tenants/:tenantId/users
GET  /api/v1/admin/tenants/:tenantId/roles
GET  /api/v1/admin/tenants/:tenantId/groups
GET  /api/v1/admin/tenants/:tenantId/audit-logs
```

Platform-level routes (not tenant-scoped):

```
GET  /api/v1/admin/advisor-assignments
GET  /api/v1/admin/advisors
GET  /api/v1/admin/tenants-list
```

## Creating a New Tenant

Tenants can be created via:
1. **API**: `POST /api/v1/tenants` (requires admin permissions)
2. **Seed Script**: The database seed script creates a default tenant for development

When a new tenant is created, the system automatically:
- Creates default tenant groups (Customers, Customer Managers)
- The tenant becomes available for advisor assignments

## Security Considerations

1. **Tenant isolation is enforced at the API level** - Middleware validates tenant access
2. **Users cannot change their own tenant** - Prevents privilege escalation
3. **Cross-tenant access is logged** - Audit trails for compliance
4. **Platform users require explicit assignment** - Advisors must be assigned to access tenants

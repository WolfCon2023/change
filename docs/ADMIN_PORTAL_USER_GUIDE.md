# CHANGE Platform - Admin Portal User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Dashboard](#dashboard)
4. [User Management](#user-management)
5. [Role Management](#role-management)
6. [Group Management](#group-management)
7. [Advisor Assignments](#advisor-assignments)
8. [Access Requests](#access-requests)
9. [API Key Management](#api-key-management)
10. [Audit Logs](#audit-logs)
11. [Access Reviews](#access-reviews)
12. [Access Review Campaigns](#access-review-campaigns)
13. [Security Gap Analysis](#security-gap-analysis)
14. [Governance](#governance)
15. [Compliance Framework Reference](#compliance-framework-reference)
16. [Glossary](#glossary)
17. [Troubleshooting](#troubleshooting)

---

## Introduction

### About the CHANGE Platform Admin Portal

The CHANGE Platform Admin Portal is a comprehensive Identity and Access Management (IAM) solution designed for enterprise environments. It provides centralized control over user identities, access permissions, security compliance, and audit trails.

### Key Capabilities

| Capability | Description |
|------------|-------------|
| **Identity Management** | Create, manage, and deactivate user accounts |
| **Access Control** | Define roles and permissions using Role-Based Access Control (RBAC) |
| **Group Management** | Organize users into groups for efficient access assignment |
| **Access Reviews** | Conduct periodic reviews to ensure least-privilege access |
| **Compliance** | Maintain compliance with SOC2, ISO 27001, NIST 800-53, and PCI-DSS |
| **Audit Logging** | Comprehensive audit trail of all IAM activities |
| **Security Analysis** | Automated security gap detection and remediation guidance |

### User Roles Overview

The platform supports the following primary roles:

| Role | Access Level | Description |
|------|--------------|-------------|
| **IT Admin** | Full Platform | Complete access across all tenants, can manage platform-wide settings |
| **Advisor** | Assigned Tenants | Access to specifically assigned tenant(s) for advisory services |
| **Manager** | Own Tenant | Full access within their own tenant |
| **Customer** | Own Tenant | Limited access based on assigned roles and permissions |

---

## Getting Started

### Accessing the Admin Portal

1. Navigate to the platform URL (e.g., `https://your-domain.com/admin`)
2. Enter your email address and password
3. If MFA is enabled, enter the verification code from your authenticator app
4. You will be directed to the Admin Dashboard

### Navigation

The admin portal uses a sidebar navigation with the following sections:

- **Dashboard** - Overview and key metrics
- **Users** - User account management
- **Roles** - Permission role definitions
- **Groups** - User group management
- **Advisor Assignments** - Advisor-tenant relationships
- **Access Requests** - Access request workflow
- **API Keys** - API key management
- **Audit Logs** - Activity audit trail
- **Access Reviews** - Individual access reviews
- **Review Campaigns** - Comprehensive access review campaigns
- **Security Gaps** - Security gap analysis dashboard
- **Governance** - Compliance and methodology alignment

### First-Time Setup Checklist

For new implementations, complete these steps in order:

- [ ] Create initial roles with appropriate permissions
- [ ] Set up user groups based on organizational structure
- [ ] Create user accounts and assign to groups
- [ ] Enable MFA for all administrative users
- [ ] Configure API keys for system integrations
- [ ] Set up an access review campaign
- [ ] Review the Security Gap Analysis

---

## Dashboard

### Overview

The Dashboard provides a real-time overview of your IAM environment's health and status.

### Key Metrics Displayed

| Metric | Description | Target |
|--------|-------------|--------|
| **Total Users** | Count of all user accounts | Informational |
| **Active Users** | Users who have logged in recently | Should be close to total |
| **MFA Coverage** | Percentage of users with MFA enabled | Target: 100% |
| **Locked Accounts** | Users currently locked out | Target: 0 |
| **Pending Requests** | Access requests awaiting approval | Review daily |
| **Open Reviews** | Access reviews in progress | Complete by due date |

### Alerts and Notifications

The dashboard highlights:
- **Users Without MFA** - List of users who need MFA enabled
- **Expiring API Keys** - Keys expiring within 30 days
- **Recent IAM Changes** - Latest audit log entries

### Using the Dashboard

**Step 1:** Review the MFA coverage percentage
- If below 100%, click on "Users Without MFA" to see the list
- Contact users to enable MFA or enable it administratively

**Step 2:** Check for locked accounts
- Locked accounts may indicate security issues or forgotten passwords
- Investigate and unlock if appropriate

**Step 3:** Review pending access requests
- Click the count to navigate to the Access Requests page
- Process requests promptly to avoid workflow delays

---

## User Management

### Purpose

User Management allows administrators to create, modify, and deactivate user accounts, manage authentication settings, and control user access.

### Accessing User Management

1. Click **Users** in the sidebar navigation
2. The Users page displays a searchable, filterable list of all users

### User List Features

| Feature | How to Use |
|---------|------------|
| **Search** | Type in the search box to find users by name or email |
| **Filter by Role** | Use the dropdown to filter by user role |
| **Filter by Status** | Toggle to show active/inactive users |
| **Sort** | Click column headers to sort |

### Creating a New User

**Step 1:** Click the **+ New User** button in the top right

**Step 2:** Fill in the required fields:
- **Email** (required) - Must be a valid email address
- **First Name** (required)
- **Last Name** (required)
- **Password** (required) - Minimum 8 characters, must include uppercase, lowercase, number, and special character

**Step 3:** Configure optional settings:
- **Role** - Select initial role assignment
- **Groups** - Assign to one or more groups
- **MFA Enabled** - Enable multi-factor authentication

**Step 4:** Click **Create User**

**Step 5:** The user will receive a welcome email with login instructions

### Editing a User

**Step 1:** Find the user in the list

**Step 2:** Click the **Edit** button (pencil icon) in the Actions column

**Step 3:** Modify the desired fields:
- Update personal information
- Change role assignments
- Modify group memberships
- Update MFA settings

**Step 4:** Click **Save Changes**

### Managing MFA

**Enabling MFA for a User:**
1. Edit the user
2. Toggle **MFA Enabled** to On
3. Save changes
4. User will be prompted to set up MFA on next login

**Disabling MFA (Emergency Only):**
1. Edit the user
2. Toggle **MFA Enabled** to Off
3. Save changes
4. Document the reason in audit notes

> **Compliance Note:** MFA should be enabled for all users per SOC2 CC6.1, ISO 27001 A.9.4.2, and NIST 800-53 IA-2.

### Locking and Unlocking Accounts

**To Lock an Account:**
1. Find the user
2. Click the **Lock** button
3. Confirm the action
4. User will be unable to log in until unlocked

**To Unlock an Account:**
1. Find the locked user
2. Click the **Unlock** button
3. Optionally reset their password
4. Confirm the action

### Deactivating a User

When an employee leaves or no longer needs access:

**Step 1:** Find the user in the list

**Step 2:** Click **Edit**

**Step 3:** Toggle **Active** to Off

**Step 4:** Save changes

> **Best Practice:** Never delete user accounts. Deactivate them instead to preserve audit trail integrity.

### Compliance Requirements

| Requirement | Framework | How Platform Addresses It |
|-------------|-----------|---------------------------|
| Unique user identification | SOC2 CC6.1 | Email-based unique identifiers |
| Strong authentication | ISO 27001 A.9.4.2 | Password complexity + MFA |
| Access revocation | NIST 800-53 AC-2 | Account deactivation workflow |
| Privileged user management | PCI-DSS 8.1 | Role-based access control |

---

## Role Management

### Purpose

Roles define sets of permissions that can be assigned to users or groups. The platform uses Role-Based Access Control (RBAC) to ensure users have only the permissions they need.

### Accessing Role Management

1. Click **Roles** in the sidebar navigation
2. View the list of all defined roles

### Understanding Permissions

Permissions follow the format: `CATEGORY_ACTION`

| Category | Available Actions | Example |
|----------|-------------------|---------|
| IAM_USER | READ, WRITE, DELETE | IAM_USER_WRITE allows creating/editing users |
| IAM_ROLE | READ, WRITE, DELETE | IAM_ROLE_READ allows viewing roles |
| IAM_GROUP | READ, WRITE, DELETE | IAM_GROUP_WRITE allows managing groups |
| IAM_AUDIT | READ | IAM_AUDIT_READ allows viewing audit logs |
| IAM_ACCESS_REQUEST | READ, WRITE, APPROVE | IAM_ACCESS_REQUEST_APPROVE allows approving requests |
| IAM_ACCESS_REVIEW | READ, WRITE, DECIDE | IAM_ACCESS_REVIEW_DECIDE allows making review decisions |
| IAM_API_KEY | READ, WRITE, DELETE | IAM_API_KEY_WRITE allows creating API keys |

### Viewing Role Details

**Step 1:** Click on a role name in the list

**Step 2:** Review the role details:
- **Name** - Display name of the role
- **Description** - Purpose of the role
- **Permissions** - List of granted permissions
- **Users Assigned** - Count of users with this role
- **Groups Using** - Groups that include this role

### Creating a New Role

**Step 1:** Click **+ New Role**

**Step 2:** Enter role information:
- **Name** (required) - Descriptive name (e.g., "Access Request Approver")
- **Description** - Explain when this role should be used

**Step 3:** Select permissions:
- Check the boxes for each permission to include
- Use the category checkboxes to select all permissions in a category

**Step 4:** Click **Create Role**

### Editing a Role

**Step 1:** Find the role in the list

**Step 2:** Click the **Edit** button

**Step 3:** Modify the role:
- Update name or description
- Add or remove permissions

**Step 4:** Click **Save Changes**

> **Warning:** Changing permissions on an existing role immediately affects all users and groups assigned to that role.

### Best Practices for Role Design

| Principle | Description | Example |
|-----------|-------------|---------|
| **Least Privilege** | Grant only necessary permissions | Don't give WRITE when READ is sufficient |
| **Separation of Duties** | Split conflicting permissions | Separate "request" and "approve" permissions |
| **Role Hierarchy** | Build roles from simple to complex | Basic → Power User → Admin |
| **Clear Naming** | Use descriptive names | "Access Request Approver" not "Role 1" |

### Pre-Built Roles

The platform includes these standard roles:

| Role | Permissions | Use Case |
|------|-------------|----------|
| **Viewer** | All READ permissions | View-only access for auditors |
| **User Manager** | IAM_USER_* | HR staff managing user accounts |
| **Access Manager** | IAM_ACCESS_REQUEST_*, IAM_ACCESS_REVIEW_* | Managers processing access requests |
| **Security Admin** | All permissions | Security team members |
| **IT Admin** | All permissions + cross-tenant | IT administrators |

### Compliance Requirements

| Requirement | Framework | How Platform Addresses It |
|-------------|-----------|---------------------------|
| Least privilege access | SOC2 CC6.3 | Granular permission model |
| Role-based access control | ISO 27001 A.9.2.3 | RBAC implementation |
| Separation of duties | NIST 800-53 AC-5 | Separate permissions for conflicting functions |
| Access restrictions | PCI-DSS 7.1 | Permissions limit data access |

---

## Group Management

### Purpose

Groups allow you to organize users and assign roles collectively, simplifying access management for teams and departments.

### Accessing Group Management

1. Click **Groups** in the sidebar navigation
2. View the list of all groups

### Group Types

| Type | Description | Example |
|------|-------------|---------|
| **Tenant Groups** | Groups specific to one tenant | "Marketing Team" |
| **Platform Groups** | Groups available across tenants | "IT Admins" |

### Viewing Group Details

**Step 1:** Click on a group name

**Step 2:** Review group information:
- **Name and Description**
- **Members** - Users in this group
- **Roles** - Roles assigned to this group
- **Created/Modified** - Timestamps

### Creating a New Group

**Step 1:** Click **+ New Group**

**Step 2:** Enter group details:
- **Name** (required) - Descriptive group name
- **Description** - Purpose of the group

**Step 3:** Assign roles to the group:
- Select one or more roles from the available list
- All group members will inherit these roles

**Step 4:** Add members:
- Search for users by name or email
- Click to add them to the group

**Step 5:** Click **Create Group**

### Managing Group Membership

**Adding Members:**
1. Edit the group
2. In the Members section, search for users
3. Click the **+** button to add them
4. Save changes

**Removing Members:**
1. Edit the group
2. Find the member in the list
3. Click the **×** button to remove them
4. Save changes

### Managing Group Roles

**Adding Roles:**
1. Edit the group
2. In the Roles section, select additional roles
3. Save changes
4. All members immediately gain the new permissions

**Removing Roles:**
1. Edit the group
2. Uncheck the roles to remove
3. Save changes
4. All members immediately lose those permissions

### Best Practices

| Practice | Description |
|----------|-------------|
| **Mirror Org Structure** | Create groups matching departments/teams |
| **Use Descriptive Names** | "Finance - Accounts Payable" not "Group 1" |
| **Document Purpose** | Use the description field |
| **Regular Review** | Audit group membership quarterly |
| **Minimize Direct Role Assignment** | Prefer group-based role assignment |

### Compliance Requirements

| Requirement | Framework | How Platform Addresses It |
|-------------|-----------|---------------------------|
| Access management | SOC2 CC6.2 | Group-based access control |
| Access review | ISO 27001 A.9.2.5 | Group membership auditing |
| Account management | NIST 800-53 AC-2 | Centralized group management |

---

## Advisor Assignments

### Purpose

Advisor Assignments manage the relationship between Advisors (consultants/external users) and the tenants they are authorized to access.

### Who Can Manage Assignments

Only **IT Admins** can create or modify advisor assignments.

### Viewing Assignments

**Step 1:** Click **Advisor Assignments** in the sidebar

**Step 2:** View the list showing:
- Advisor name and email
- Assigned tenant(s)
- Assignment date
- Status (active/inactive)

### Creating an Assignment

**Step 1:** Click **+ New Assignment**

**Step 2:** Select the advisor:
- Search for the user (must have Advisor role)
- Select from the list

**Step 3:** Select the tenant:
- Choose the tenant to grant access to

**Step 4:** Click **Create Assignment**

**Step 5:** The advisor can now access the assigned tenant's data

### Removing an Assignment

**Step 1:** Find the assignment in the list

**Step 2:** Click the **Delete** button

**Step 3:** Confirm the removal

**Step 4:** The advisor immediately loses access to that tenant

### Use Cases

| Scenario | Action |
|----------|--------|
| New consultant engagement | Create assignment for consultant to client tenant |
| Engagement ends | Remove assignment |
| Multi-tenant access needed | Create multiple assignments for same advisor |

---

## Access Requests

### Purpose

Access Requests provide a formal workflow for users to request additional access, ensuring proper approval and documentation.

### Access Request Workflow

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Request    │ → │   Pending    │ → │   Review     │ → │   Approved/  │
│   Submitted  │    │   Approval   │    │   by Manager │    │   Rejected   │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
```

### Viewing Access Requests

**Step 1:** Click **Access Requests** in the sidebar

**Step 2:** Use the tabs to filter:
- **All** - All requests
- **Pending** - Awaiting approval
- **Approved** - Recently approved
- **Rejected** - Denied requests

### Creating an Access Request

**Step 1:** Click **+ New Request**

**Step 2:** Fill in the request details:
- **Request Type** - Role, Group, or Permission
- **Requested Item** - The specific role/group/permission
- **Justification** - Business reason for the request
- **Duration** - Permanent or temporary access

**Step 3:** Click **Submit Request**

**Step 4:** Request enters pending state for approval

### Approving/Rejecting Requests

**Requires:** `IAM_ACCESS_REQUEST_APPROVE` permission

**Step 1:** Navigate to Access Requests

**Step 2:** Click on a pending request to view details

**Step 3:** Review the request:
- Who is requesting
- What they're requesting
- Their justification
- Current access level

**Step 4:** Make a decision:
- Click **Approve** to grant access
- Click **Reject** to deny access
- Add notes explaining your decision

**Step 5:** The requester is notified of the decision

### Compliance Requirements

| Requirement | Framework | How Platform Addresses It |
|-------------|-----------|---------------------------|
| Formal access authorization | SOC2 CC6.2 | Request workflow with approval |
| Documented approvals | ISO 27001 A.9.2.1 | Full audit trail of requests |
| Access provisioning | NIST 800-53 AC-2 | Controlled access granting |
| Authorized access | PCI-DSS 7.1 | Manager approval required |

---

## API Key Management

### Purpose

API Keys enable secure programmatic access to the platform for integrations, automation, and third-party applications.

### Accessing API Key Management

1. Click **API Keys** in the sidebar
2. View all API keys for your tenant

### API Key Properties

| Property | Description |
|----------|-------------|
| **Name** | Descriptive identifier |
| **Created** | When the key was generated |
| **Expires** | Expiration date (if set) |
| **Last Used** | Most recent usage |
| **Status** | Active or revoked |

### Creating an API Key

**Step 1:** Click **+ New API Key**

**Step 2:** Configure the key:
- **Name** (required) - Purpose of this key (e.g., "CI/CD Pipeline")
- **Expiration** - When the key should expire
- **Permissions** - What the key can access

**Step 3:** Click **Create Key**

**Step 4:** **IMPORTANT** - Copy the key value immediately
- The full key is only shown once
- Store it securely (e.g., secrets manager)

### Rotating an API Key

To maintain security, rotate API keys periodically:

**Step 1:** Create a new API key with the same permissions

**Step 2:** Update your applications to use the new key

**Step 3:** Verify the new key works correctly

**Step 4:** Revoke the old key

### Revoking an API Key

**Step 1:** Find the key in the list

**Step 2:** Click **Revoke**

**Step 3:** Confirm the action

**Step 4:** The key is immediately invalidated

> **Warning:** Revoking a key will immediately break any integrations using it.

### Best Practices

| Practice | Description |
|----------|-------------|
| **Set Expiration** | Always set an expiration date |
| **Rotate Regularly** | Rotate keys every 90 days |
| **Use Descriptive Names** | "GitHub Actions - Prod Deploy" not "Key 1" |
| **Least Privilege** | Grant only necessary permissions |
| **Monitor Usage** | Review "Last Used" regularly |
| **Secure Storage** | Use secrets managers, not code repositories |

### Compliance Requirements

| Requirement | Framework | How Platform Addresses It |
|-------------|-----------|---------------------------|
| Key management | SOC2 CC6.6 | Centralized key lifecycle management |
| Cryptographic controls | ISO 27001 A.10.1.1 | Secure key generation and storage |
| Authenticator management | NIST 800-53 IA-5 | Key expiration and rotation |
| Unique service accounts | PCI-DSS 8.6 | Named, trackable API keys |

---

## Audit Logs

### Purpose

Audit Logs provide a comprehensive, tamper-evident record of all IAM activities for security monitoring, compliance, and forensic investigation.

### Accessing Audit Logs

1. Click **Audit Logs** in the sidebar
2. View the chronological list of all IAM events

### Audit Log Entry Contents

Each entry includes:

| Field | Description |
|-------|-------------|
| **Timestamp** | When the action occurred |
| **Actor** | Who performed the action |
| **Action** | What was done (e.g., USER_CREATED) |
| **Resource** | What was affected |
| **Details** | Additional context |
| **IP Address** | Source of the action |
| **Result** | Success or failure |

### Filtering Audit Logs

**By Date Range:**
1. Click the date picker
2. Select start and end dates
3. Click Apply

**By Action Type:**
1. Use the Action dropdown
2. Select one or more action types
3. View filtered results

**By Actor:**
1. Use the Actor search
2. Type user name or email
3. Results filter automatically

**By Resource:**
1. Use the Resource search
2. Type resource ID or name
3. View related events

### Exporting Audit Logs

**Step 1:** Apply any desired filters

**Step 2:** Click **Export**

**Step 3:** Select format:
- **CSV** - For spreadsheet analysis
- **JSON** - For programmatic processing

**Step 4:** Download the file

### Audit Log Retention

| Environment | Retention Period |
|-------------|------------------|
| Production | 7 years |
| Non-Production | 1 year |

### Key Events to Monitor

| Event | Description | Why It Matters |
|-------|-------------|----------------|
| USER_CREATED | New user account | Unauthorized accounts |
| USER_DELETED | Account removal | Data destruction |
| ROLE_ASSIGNED | Permission change | Privilege escalation |
| LOGIN_FAILED | Failed authentication | Brute force attacks |
| MFA_DISABLED | MFA turned off | Security degradation |
| API_KEY_CREATED | New API key | Potential unauthorized access |
| ACCESS_REQUEST_APPROVED | Access granted | Verify appropriate |

### Compliance Requirements

| Requirement | Framework | How Platform Addresses It |
|-------------|-----------|---------------------------|
| Audit trail | SOC2 CC7.2 | Comprehensive logging of all actions |
| Log protection | ISO 27001 A.12.4.2 | Tamper-evident storage |
| Audit records | NIST 800-53 AU-2 | All security-relevant events logged |
| Audit trail | PCI-DSS 10.2 | Track all access to system components |

---

## Access Reviews

### Purpose

Access Reviews enable periodic validation that users have appropriate access levels, supporting the principle of least privilege and compliance requirements.

### Types of Access Reviews

| Type | Description | Frequency |
|------|-------------|-----------|
| **Periodic** | Regular scheduled reviews | Quarterly |
| **Event-Driven** | Triggered by changes | As needed |
| **Certification** | Full access certification | Annually |
| **Dormant Account** | Inactive user review | Monthly |

### Creating an Access Review

**Step 1:** Click **Access Reviews** in the sidebar

**Step 2:** Click **+ Create Review**

**Step 3:** Configure the review:
- **Name** - Descriptive title
- **Review Type** - Select from types above
- **Scope** - What to review (all users, specific roles, etc.)
- **Due Date** - When review must be completed
- **Reviewers** - Who will conduct the review

**Step 4:** Click **Create**

### Conducting a Review

**Step 1:** Open the review from the list

**Step 2:** For each access item, make a decision:
- **Keep** - Access is appropriate
- **Remove** - Access should be revoked
- **Modify** - Access should be changed

**Step 3:** Add notes explaining your decision (required for Remove/Modify)

**Step 4:** Submit when all items are reviewed

### Review Decisions

| Decision | Description | Action Taken |
|----------|-------------|--------------|
| **Keep** | Access is appropriate and justified | No change |
| **Remove** | Access is no longer needed | Revoke access |
| **Modify** | Access level should change | Adjust permissions |

### Closing a Review

**Step 1:** Ensure all items have decisions

**Step 2:** Review the summary:
- Items kept
- Items to be removed
- Items to be modified

**Step 3:** Click **Close Review**

**Step 4:** System automatically applies changes (for Remove/Modify)

### Compliance Requirements

| Requirement | Framework | How Platform Addresses It |
|-------------|-----------|---------------------------|
| Periodic access review | SOC2 CC6.3 | Scheduled review workflow |
| Access rights review | ISO 27001 A.9.2.5 | Documented review process |
| Access review | NIST 800-53 AC-2 | Regular access certification |
| User access review | PCI-DSS 7.1.2 | Quarterly access validation |

---

## Access Review Campaigns

### Purpose

Access Review Campaigns provide a comprehensive framework for reviewing user access at scale, including subjects (users), their access items (roles, permissions), and group certifications.

### Campaign Workflow

```
┌──────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐   ┌───────────┐
│  Draft   │ → │ In Review │ → │ Submitted │ → │ Approved  │ → │ Completed │
│          │   │           │   │           │   │           │   │           │
│ Configure│   │ Make      │   │ Awaiting  │   │ Implement │   │ Archived  │
│ campaign │   │ decisions │   │ approval  │   │ changes   │   │           │
└──────────┘   └───────────┘   └───────────┘   └───────────┘   └───────────┘
```

### Accessing Review Campaigns

1. Click **Review Campaigns** in the sidebar
2. View all campaigns with their status and progress

### Campaign List View

The list shows:
- **Campaign Name** - Title of the review
- **Status** - Current workflow stage
- **Environment** - Target environment
- **Progress** - Completion percentage
- **Due Date** - Deadline for completion
- **Actions** - View, Edit, or manage

### Creating a New Campaign

#### Step 1: Basic Information

1. Click **+ New Campaign**
2. Enter campaign details:
   - **Name** (required) - e.g., "Q1 2024 Quarterly Access Review"
   - **Description** - Purpose and scope
   - **System Name** - Application being reviewed
   - **Environment** - Production, Development, etc.
   - **Business Unit** - Department scope

#### Step 2: Review Configuration

1. Select **Review Type**:
   - **Periodic Review** - Regular scheduled review
   - **Role-Based Review** - Focus on specific roles
   - **Event-Driven Review** - Triggered by change
   - **Certification** - Full compliance certification

2. Set **Review Period**:
   - Period Start - Beginning of review timeframe
   - Period End - End of review timeframe

3. Assign **Reviewer**:
   - Manager - Direct manager of users
   - Application Owner - System owner
   - Security Team - Security personnel
   - IT Admin - IT administrators

#### Step 3: Add Subjects

Subjects are the users whose access will be reviewed.

**Manual Add:**
1. Click **Manual Add** tab
2. Enter user details:
   - Full Name, Email
   - Job Title, Department
   - Manager Name
   - Employment Type

**Bulk Select:**
1. Click **Bulk Select** tab
2. Check users from the list
3. Click **Add Selected Users**

#### Step 4: Configure Access Items

For each subject, add the access items to review:
- **Application** - System name
- **Role Name** - The role being reviewed
- **Privilege Level** - Standard, Elevated, Admin, Super Admin
- **Data Classification** - Public, Internal, Confidential, Restricted
- **Grant Method** - How access was granted

#### Step 5: Set Workflow

1. Set **Due Date** - When the campaign must be completed
2. Review settings and click **Create Campaign**

### Conducting a Campaign Review

#### Navigating the Campaign

1. Open the campaign from the list
2. Use the tabs to navigate:
   - **Overview** - Summary statistics
   - **Subjects** - User access items to review
   - **Groups** - Group certification
   - **Approvals** - Approval status
   - **Workflow** - Timeline and status

#### Making Decisions on Access Items

For each access item, choose:

| Decision | When to Use | Required Action |
|----------|-------------|-----------------|
| **Approve** | Access is appropriate | None |
| **Revoke** | Access should be removed | Add justification |
| **Modify** | Access level should change | Specify new level |
| **Escalate** | Needs higher review | Route to approver |

**Individual Decision:**
1. Expand a subject to see their access items
2. Click on an item to make a decision
3. Select the decision type
4. Add notes (required for Revoke/Modify)
5. Save

**Bulk Decisions:**
1. Use filters to narrow the view:
   - By privilege level (Standard, Elevated, Admin)
   - By data classification
   - By decision status

2. Use bulk actions:
   - **Approve Standard** - Approve all standard access
   - **Approve All** - Approve everything visible
   - **Approve Selected** - Approve checked items

#### Smart Suggestions

The platform provides AI-powered suggestions:

| Confidence | Indicator | Recommended Action |
|------------|-----------|-------------------|
| **High** | Green banner | Safe to accept suggestion |
| **Medium** | Yellow banner | Review before accepting |
| **Low** | Red banner | Manual review required |

To use suggestions:
1. Enable **Show Suggestions** toggle
2. Review each suggestion and its reasoning
3. Click **Apply** to accept or make your own decision

### Group Certification

#### Purpose

Group certification validates that group memberships and permissions are appropriate.

#### Certifying a Group

1. Navigate to the **Groups** tab
2. Click on a group to expand it
3. Review two aspects:

**Membership Review:**
- Verify all members should be in this group
- Click **Certify Membership** when validated

**Permissions Review:**
- Verify the group's roles are appropriate
- Click **Certify Permissions** when validated

4. A group is fully certified when both are completed

### Submitting for Approval

When all decisions are made:

1. Navigate to the **Overview** tab
2. Verify completion percentage is 100%
3. Click **Submit for Review**
4. Enter attestation:
   - Your name
   - Your email
   - Check the attestation box
5. Click **Submit**

### Approval Workflow

#### For Campaigns Requiring Second-Level Approval

1. The campaign enters **Submitted** status
2. Navigate to the campaign
3. Approvers see **Approve** and **Reject** buttons
4. Click **Approve Campaign** to complete
5. Or click **Reject** to return for re-review

#### For Campaigns Without Second-Level Approval

1. Click **Complete Review** button
2. Campaign is marked as completed

### Tracking Progress

#### Workflow Tab

Shows the campaign timeline:
- **Created** - When campaign was created
- **Submitted** - When submitted for approval
- **Approved** - When approval was given
- **Completed** - When campaign was finalized

#### Review Summary

Displays decision statistics:
- Number of items approved
- Number of items revoked
- Number of items modified
- Pending decisions

#### Remediation Tracking

For revoked or modified access:
- **Status** - Pending, In Progress, Completed
- **Ticket** - Integration with ticketing system
- **Items** - List of items requiring action

### Compliance Requirements

| Requirement | Framework | How Platform Addresses It |
|-------------|-----------|---------------------------|
| Access certification | SOC2 CC6.3 | Formal campaign workflow |
| Access review records | ISO 27001 A.9.2.5 | Full decision documentation |
| Periodic reauthorization | NIST 800-53 AC-2 | Scheduled campaign reviews |
| Quarterly review | PCI-DSS 7.1.2 | Due date enforcement |

---

## Security Gap Analysis

### Purpose

The Security Gap Analysis provides an automated assessment of your IAM configuration against security best practices and compliance requirements, identifying vulnerabilities and providing remediation guidance.

### Accessing Security Gap Analysis

1. Click **Security Gaps** in the sidebar
2. View the comprehensive security dashboard

### Security Score

The Security Score (0-100) provides an at-a-glance assessment:

| Score Range | Rating | Indicator |
|-------------|--------|-----------|
| 80-100 | Good | Green - Minor improvements possible |
| 60-79 | Fair | Yellow - Address high-priority items |
| 40-59 | Needs Attention | Orange - Multiple issues to resolve |
| 0-39 | Critical | Red - Immediate action required |

#### Score Calculation

The score is calculated based on identified gaps:

| Severity | Point Deduction |
|----------|-----------------|
| Critical | -25 points |
| High | -15 points |
| Medium | -8 points |
| Low | -3 points |

### Gap Categories

| Category | What It Checks |
|----------|----------------|
| **Authentication** | MFA coverage, password policies |
| **Access Management** | Inactive users, group membership |
| **Privilege Management** | Admin access levels, separation of duties |
| **API Security** | Key expiration, rotation |
| **Compliance** | Access review frequency |

### Understanding Security Gaps

Each identified gap includes:

| Component | Description |
|-----------|-------------|
| **Severity** | Critical, High, Medium, or Low |
| **Title** | Brief description of the issue |
| **Description** | Detailed explanation of the risk |
| **Affected Items** | Specific users, keys, or resources |
| **Recommendation** | How to fix the issue |
| **Compliance Frameworks** | Which standards this affects |

### Gap Details

#### Gap: Users Without MFA

| Attribute | Value |
|-----------|-------|
| **Severity** | Critical (>5 users) or High |
| **Risk** | Accounts vulnerable to credential theft |
| **Recommendation** | Enable MFA for all users |
| **Compliance** | SOC2 CC6.1, ISO 27001 A.9.4.2, NIST IA-2, PCI-DSS 8.3 |

**Remediation Steps:**
1. Navigate to Users
2. For each affected user, edit their profile
3. Enable MFA
4. Notify user to complete MFA setup

#### Gap: Inactive User Accounts

| Attribute | Value |
|-----------|-------|
| **Severity** | High (>10 users) or Medium |
| **Risk** | Dormant accounts may be compromised |
| **Recommendation** | Review and disable inactive accounts |
| **Compliance** | SOC2 CC6.2, ISO 27001 A.9.2.6, NIST AC-2 |

**Remediation Steps:**
1. Review the list of inactive users
2. Contact managers to verify employment status
3. Disable accounts no longer needed
4. Document exceptions for users who need access despite inactivity

#### Gap: Excessive Administrative Access

| Attribute | Value |
|-----------|-------|
| **Severity** | Critical (>40%) or High (>20%) |
| **Risk** | Broad admin access increases breach impact |
| **Recommendation** | Apply principle of least privilege |
| **Compliance** | SOC2 CC6.3, ISO 27001 A.9.2.3, NIST AC-6, PCI-DSS 7.1 |

**Remediation Steps:**
1. Review users with admin access
2. Identify those who don't need full admin
3. Create more granular roles if needed
4. Reassign users to appropriate roles

#### Gap: API Key Management Issues

| Attribute | Value |
|-----------|-------|
| **Severity** | High (no expiration or expired) or Medium |
| **Risk** | Keys without rotation may be compromised |
| **Recommendation** | Set expiration and rotate regularly |
| **Compliance** | SOC2 CC6.6, ISO 27001 A.10.1.1, NIST IA-5 |

**Remediation Steps:**
1. Review problematic API keys
2. For keys without expiration:
   - Create new keys with expiration
   - Update integrations
   - Revoke old keys
3. For expiring keys:
   - Schedule rotation before expiration
   - Update integrations in advance

#### Gap: No Recent Access Reviews

| Attribute | Value |
|-----------|-------|
| **Severity** | High |
| **Risk** | Users may have accumulated unnecessary access |
| **Recommendation** | Conduct quarterly access reviews |
| **Compliance** | SOC2 CC6.3, ISO 27001 A.9.2.5, NIST AC-2, HIPAA |

**Remediation Steps:**
1. Create a new Access Review Campaign
2. Include all users or focus on high-risk areas
3. Set due date within 30 days
4. Assign reviewers and complete the review

#### Gap: Users Without Group Membership

| Attribute | Value |
|-----------|-------|
| **Severity** | Low |
| **Risk** | May indicate incomplete provisioning |
| **Recommendation** | Assign users to appropriate groups |
| **Compliance** | SOC2 CC6.2, ISO 27001 A.9.2.3 |

**Remediation Steps:**
1. Review users without group membership
2. Identify appropriate groups based on role/department
3. Add users to groups
4. Verify access is appropriate

#### Gap: Separation of Duties Violations

| Attribute | Value |
|-----------|-------|
| **Severity** | High |
| **Risk** | Users can both create and approve their own access |
| **Recommendation** | Separate conflicting permissions |
| **Compliance** | SOC2 CC6.3, ISO 27001 A.6.1.2, SOX, PCI-DSS 6.4 |

**Remediation Steps:**
1. Identify users with conflicting permissions
2. Determine which permission they actually need
3. Remove the unnecessary permission
4. If both are needed, implement compensating controls

### Quick Actions

The dashboard provides one-click remediation:

| Action | What It Does |
|--------|--------------|
| **Enable MFA** | Navigate to Users to enable MFA |
| **Start Access Review** | Create a new access review campaign |

### Filtering Gaps

**By Severity:**
- Click on severity counts (Critical, High, Medium, Low)
- View only gaps of that severity

**By Category:**
- Use the Category dropdown
- Select specific category to focus on

### Exporting the Report

1. Click **Export Report**
2. Select format (PDF or CSV)
3. Download the security assessment

### Compliance Framework Mapping

The bottom section shows compliance impact:

| Framework | Status | Indicator |
|-----------|--------|-----------|
| **SOC2** | Gaps affecting / No gaps | Orange or Green |
| **ISO 27001** | Gaps affecting / No gaps | Orange or Green |
| **NIST 800-53** | Gaps affecting / No gaps | Orange or Green |
| **PCI-DSS** | Gaps affecting / No gaps | Orange or Green |

Click on a framework to see which gaps affect that specific compliance standard.

---

## Governance

### Purpose

The Governance page shows how IAM aligns with process improvement methodologies: SIPOC, DMAIC, and the CHANGE framework.

### Accessing Governance

1. Click **Governance** in the sidebar
2. View the methodology alignment

### SIPOC Alignment

SIPOC (Suppliers, Inputs, Process, Outputs, Customers) maps IAM elements:

| Element | IAM Components |
|---------|----------------|
| **Suppliers** | HR Systems, Identity Providers, Onboarding workflows |
| **Inputs** | User registration requests, Role assignments, Access requests |
| **Process** | Identity provisioning, RBAC, Permission enforcement, Audit logging |
| **Outputs** | Authenticated sessions, Authorized access, Audit trails |
| **Customers** | End users, Managers, Auditors, Security team |

### DMAIC Framework

DMAIC (Define, Measure, Analyze, Improve, Control) applied to IAM:

| Phase | IAM Activities | Platform Links |
|-------|----------------|----------------|
| **Define** | Role definitions, Permission catalog, Access policies | Roles, Groups |
| **Measure** | User activity, MFA coverage, Access patterns | Audit Logs, Dashboard |
| **Analyze** | Security gap analysis, Inactive users, Role drift | Security Gaps |
| **Improve** | Access request workflow, Policy updates, MFA enforcement | Access Requests |
| **Control** | Access reviews, Continuous monitoring, API key rotation | Review Campaigns |

### CHANGE Phase Gates

The CHANGE methodology provides IAM readiness checks:

| Phase | Description | IAM Checks |
|-------|-------------|------------|
| **C - Confirm** | Confirm stakeholder access requirements | Roles defined, Groups established |
| **H - Hone** | Refine access controls | Least privilege, MFA coverage, Audit logging |
| **A - Assess** | Assess current access | Access reviews, Pending requests, Locked accounts |
| **N - Navigate** | Navigate implementation | Service accounts, Integration access |
| **G - Generate** | Generate compliance evidence | Audit trail, Export capability |
| **E - Evaluate** | Evaluate effectiveness | Metrics dashboard, Continuous monitoring |

### Readiness Indicators

| Indicator | Meaning |
|-----------|---------|
| **Ready** (Green) | All checks complete |
| **Review** (Yellow) | Some items need attention |
| **Not Ready** (Red) | Critical items incomplete |

---

## Compliance Framework Reference

### SOC 2 (Service Organization Control 2)

| Control | Description | Platform Feature |
|---------|-------------|------------------|
| CC6.1 | Logical access security | User management, MFA |
| CC6.2 | Authorization and access | Access requests, Groups |
| CC6.3 | Removal of access | User deactivation, Access reviews |
| CC6.6 | System boundaries | API key management |
| CC7.2 | Monitoring anomalies | Audit logs |

### ISO 27001

| Control | Description | Platform Feature |
|---------|-------------|------------------|
| A.9.2.1 | User registration | User management |
| A.9.2.3 | Privileged access | Role management |
| A.9.2.5 | Access rights review | Access review campaigns |
| A.9.4.2 | Secure log-on | MFA, password policies |
| A.12.4.2 | Log protection | Audit log retention |

### NIST 800-53

| Control | Description | Platform Feature |
|---------|-------------|------------------|
| AC-2 | Account management | User lifecycle management |
| AC-5 | Separation of duties | Role-based permissions |
| AC-6 | Least privilege | Granular permission model |
| IA-2 | Identification and authentication | MFA |
| AU-2 | Audit events | Comprehensive audit logging |

### PCI-DSS

| Requirement | Description | Platform Feature |
|-------------|-------------|------------------|
| 7.1 | Limit access by job | RBAC |
| 7.1.2 | Privileged access | Admin role tracking |
| 8.1 | User identification | Unique user IDs |
| 8.3 | Multi-factor authentication | MFA support |
| 10.2 | Audit trails | Audit logging |

---

## Glossary

| Term | Definition |
|------|------------|
| **API Key** | A credential used for programmatic access to the platform |
| **Access Request** | A formal request for additional permissions |
| **Access Review** | A process to validate user access is appropriate |
| **Access Review Campaign** | A comprehensive review covering multiple users and their access |
| **Audit Log** | A record of all security-relevant activities |
| **Group** | A collection of users with shared role assignments |
| **IAM** | Identity and Access Management |
| **MFA** | Multi-Factor Authentication - requires two forms of verification |
| **Permission** | A specific capability granted to a user or role |
| **RBAC** | Role-Based Access Control - permissions assigned through roles |
| **Role** | A named collection of permissions |
| **Subject** | A user being reviewed in an access review campaign |
| **Tenant** | An isolated organizational unit within the platform |

---

## Troubleshooting

### Common Issues

#### Cannot Log In

**Symptoms:** Login fails with "Invalid credentials"

**Solutions:**
1. Verify email is correct
2. Reset password using "Forgot Password"
3. Check if account is locked (contact admin)
4. Verify MFA code is current (wait for new code)

#### Access Denied

**Symptoms:** "You don't have permission" error

**Solutions:**
1. Check your role assignments
2. Contact your manager to request access
3. Submit an access request through the portal

#### MFA Not Working

**Symptoms:** MFA codes are rejected

**Solutions:**
1. Verify device time is synchronized
2. Wait for a new code (don't reuse old codes)
3. Contact admin to reset MFA

#### Page Not Loading

**Symptoms:** Blank page or continuous loading

**Solutions:**
1. Refresh the browser
2. Clear browser cache
3. Try a different browser
4. Check internet connection

### Getting Help

If you need additional assistance:

1. **Documentation:** Review this user guide
2. **In-App Help:** Click the help icon in the navigation
3. **Support:** Contact your IT administrator
4. **Security Issues:** Report immediately to security team

---

## Document Information

| Property | Value |
|----------|-------|
| **Version** | 1.0 |
| **Last Updated** | February 2026 |
| **Author** | CHANGE Platform Team |
| **Review Cycle** | Quarterly |

---

*This document is confidential and intended for authorized users only. Do not distribute without approval.*

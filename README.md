# CHANGE Platform

Business Formation & Advisory System - Phase 1 MVP ("Beginning Step")

## Overview

The CHANGE Platform is a comprehensive business formation and advisory system designed to guide entrepreneurs through the process of starting and formalizing their businesses.

### Core Workflow

```
Client Intake → Program Enrollment → Formation Wizard → SOS & EIN Tasks → Document Generation → Advisor Review → Completion/Handoff
```

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + shadcn/ui
- **Backend**: Node.js + Express + TypeScript
- **Database**: MongoDB with Mongoose
- **Auth**: JWT-based with RBAC
- **Monorepo**: npm workspaces + Turborepo

## Project Structure

```
change/
├── apps/
│   ├── api/          # Express API server
│   └── web/          # React frontend
├── packages/
│   └── shared/       # Shared types, schemas, constants
├── docs/             # Architecture documentation
└── .github/          # CI/CD workflows
```

## Requirements Traceability

### Functional Requirements (PRD)
- **PRD-FR-001**: Client Onboarding - Guided onboarding for new/existing businesses
- **PRD-FR-002**: Program Enrollment - Enroll clients into CHANGE cohorts; track status
- **PRD-FR-003**: Business Formation - Guide through SOS registration and EIN preparation
- **PRD-FR-004**: Document Generation - Generate foundational business documents
- **PRD-FR-005**: Task Management - Manage formation/operational checklists
- **PRD-FR-006**: Advisor Oversight - Progress dashboards for advisors

### Technical Requirements (TRS)
- **TRS-ARCH-001**: Multi-tenant data isolation
- **TRS-ARCH-002**: Role-based access control (RBAC)
- **TRS-ARCH-003**: Gated workflows for CHANGE phases
- **TRS-ARCH-004**: Document templates with versioning + data merge

## Getting Started

### Prerequisites

- Node.js >= 20.x
- npm >= 10.x
- MongoDB 7.x (local or cloud)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/change.git
cd change

# Install dependencies
npm install

# Copy environment files
cp apps/api/.env.sample apps/api/.env
# Edit .env with your configuration

# Build shared package
npm run build --workspace=@change/shared

# Start development servers
npm run dev
```

### Environment Variables

#### API (`apps/api/.env`)

```env
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/change_platform
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
CORS_ORIGIN=http://localhost:5173
```

### Seeding the Database

```bash
# Seed demo data
npm run db:seed
```

This creates:
- System admin: `admin@change-platform.com` / `Admin123!`
- Advisor: `advisor@change-platform.com` / `Advisor123!`
- Demo client: `demo@example.com` / `Demo123!`

### Running Locally

```bash
# Start all services (API + Web)
npm run dev

# Or start individually
npm run dev --workspace=@change/api
npm run dev --workspace=@change/web
```

- **API**: http://localhost:3001
- **Web**: http://localhost:5173

## API Documentation

### Base URL
```
/api/v1
```

### Authentication

```bash
# Login
POST /api/v1/auth/login
{
  "email": "demo@example.com",
  "password": "Demo123!"
}

# Response
{
  "success": true,
  "data": {
    "user": { ... },
    "accessToken": "jwt...",
    "refreshToken": "jwt...",
    "expiresIn": 86400
  }
}
```

### Protected Endpoints

Include the JWT token in the Authorization header:
```
Authorization: Bearer <accessToken>
```

### Core Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User login |
| `/auth/register` | POST | User registration |
| `/auth/refresh` | POST | Refresh access token |
| `/auth/me` | GET | Get current user |
| `/tenants` | GET/POST | Tenant management (admin) |
| `/health` | GET | Health check |

## User Roles

| Role | Description |
|------|-------------|
| `system_admin` | Full system access |
| `program_admin` | Program management |
| `advisor` | Client oversight |
| `client_owner` | Business owner |
| `client_admin` | Business administrator |
| `client_contributor` | Read/limited write |

## Deployment

### Railway

The project is configured for Railway deployment.

1. Create a new Railway project
2. Add MongoDB service
3. Link the GitHub repository
4. Set environment variables
5. Deploy

## Development

### Code Style

- ESLint for linting
- Prettier for formatting
- Husky for pre-commit hooks

```bash
# Lint
npm run lint

# Format
npm run format

# Type check
npm run typecheck
```

### Testing

```bash
# Run tests
npm run test

# With coverage
npm run test:coverage
```

## Sprint Deliverables

### Sprint 0 (Foundation) ✅
- [x] Monorepo structure with npm workspaces + Turborepo
- [x] Shared types package
- [x] API with Express + TypeScript + MongoDB
- [x] Auth + RBAC baseline (TRS-ARCH-002)
- [x] Multi-tenant middleware (TRS-ARCH-001)
- [x] Audit logging service
- [x] Web app with React + Vite + TypeScript
- [x] Seed data and minimal UI shell
- [x] CI/CD configuration

### Sprint 1 (Onboarding + Enrollment) - Next
- [ ] Client onboarding flow UI + API (PRD-FR-001)
- [ ] Enrollment into cohort with status tracking (PRD-FR-002)
- [ ] Gating framework for phases (TRS-ARCH-003)
- [ ] Audit logs for onboarding/enrollment

### Sprint 2 (Formation Wizard + Tasks)
- [ ] Formation wizard steps (PRD-FR-003)
- [ ] Task/checklist management (PRD-FR-005)
- [ ] SOS & EIN task bundles
- [ ] Gated progression

### Sprint 3 (Documents + Advisor Review)
- [ ] Document templates with versioning (PRD-FR-004, TRS-ARCH-004)
- [ ] Advisor dashboard (PRD-FR-006)
- [ ] Document approval workflow

## License

Copyright © 2026 CHANGE Platform. All rights reserved.

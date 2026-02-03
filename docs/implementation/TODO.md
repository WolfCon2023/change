# CHANGE Business Apps - Implementation TODO

**Last Updated:** February 2026

---

## Module 1: Business Setup Wizard + Archetype Library

**Status:** IN PROGRESS

### 1.1 Models (Backend)

- [x] Create `BusinessArchetype` model
- [x] Create `Artifact` model  
- [x] Create `WorkflowTemplate` model
- [x] Create `Rule` model
- [x] Update `BusinessProfile` model with new fields
  - [x] archetypeKey
  - [x] formationStatus
  - [x] einStatus
  - [x] readinessFlags
  - [x] riskProfile
- [x] Update models index exports
- [x] Add shared constants (FormationStatus, EINStatus, etc.)

### 1.2 Seed Data

- [ ] Create archetype seed file with 12 archetypes:
  - [ ] Professional Services
  - [ ] Home Services
  - [ ] E-commerce
  - [ ] Retail Store
  - [ ] Food Business
  - [ ] Personal Care/Beauty
  - [ ] Fitness/Coaching
  - [ ] Real Estate Services
  - [ ] Construction/Trades
  - [ ] Transportation/Delivery
  - [ ] Childcare
  - [ ] Nonprofit
- [ ] Each archetype includes:
  - [ ] Top 5 processes
  - [ ] Top 8 KPIs
  - [ ] Starter SOP list
  - [ ] Risk checklist starters

### 1.3 API Routes

- [ ] Create `/api/v1/app` router
- [ ] Setup routes:
  - [ ] GET `/app/setup/status`
  - [ ] POST `/app/setup/start`
  - [ ] PUT `/app/setup/archetype`
  - [ ] PUT `/app/setup/entity-type`
  - [ ] PUT `/app/setup/state`
  - [ ] POST `/app/setup/complete`
- [ ] Archetype routes:
  - [ ] GET `/app/archetypes`
  - [ ] GET `/app/archetypes/:key`
- [ ] Profile routes:
  - [ ] GET `/app/profile`
  - [ ] PUT `/app/profile`
  - [ ] GET `/app/profile/readiness`

### 1.4 Frontend

- [ ] Create `/app` layout with sidebar navigation
- [ ] Create AppHomePage (`/app/home`)
  - [ ] Today view with next actions
  - [ ] Blockers display
  - [ ] Approvals needed (advisor)
- [ ] Create BusinessSetupWizard (`/app/setup`)
  - [ ] Step 1: Welcome + archetype selection
  - [ ] Step 2: Entity type selection with guidance
  - [ ] Step 3: State selection with requirements preview
  - [ ] Step 4: Basic business info
  - [ ] Step 5: Review + complete
- [ ] Add disclaimer banner component
- [ ] Add app routes to main router

### 1.5 Acceptance Criteria

- [ ] User can access `/app/home` and see empty state
- [ ] User can start setup wizard from home
- [ ] User can browse and select an archetype
- [ ] User can select entity type with recommendations shown
- [ ] User can select formation state
- [ ] User can enter basic business info
- [ ] Completing wizard creates/updates BusinessProfile with archetypeKey
- [ ] Readiness flags update automatically
- [ ] Audit log entry created for setup completion

---

## Module 2: Workflow Engine + Formation Workflow

**Status:** NOT STARTED

### 2.1 Workflow Engine Service

- [ ] Create `WorkflowService` with methods:
  - [ ] `startWorkflow(tenantId, templateKey)`
  - [ ] `getActiveWorkflow(tenantId)`
  - [ ] `updateStepData(instanceId, stepKey, data)`
  - [ ] `submitStepForReview(instanceId, stepKey)`
  - [ ] `approveStep(instanceId, stepKey, approverId)`
  - [ ] `checkGate(instanceId, phaseKey)`
  - [ ] `advancePhase(instanceId)`
- [ ] Implement gate checking logic
- [ ] Implement rules hook evaluation

### 2.2 Rules Engine Service

- [ ] Create `RuleService` with methods:
  - [ ] `evaluateRules(context, ruleKeys)`
  - [ ] `getApplicableRules(context)`
  - [ ] `explainRule(ruleKey, context)` - returns why rule matched
- [ ] Implement condition evaluation
- [ ] Implement action execution

### 2.3 Formation Workflow Template

- [ ] Seed business-formation workflow template with phases:
  - [ ] Phase 1: Business Information
  - [ ] Phase 2: Registered Agent
  - [ ] Phase 3: Owners/Officers
  - [ ] Phase 4: SOS Filing Preparation
  - [ ] Phase 5: EIN Application
  - [ ] Phase 6: Foundational Documents
  - [ ] Phase 7: Review + Completion

### 2.4 API Routes

- [ ] Workflow routes:
  - [ ] GET `/app/workflows/templates`
  - [ ] GET `/app/workflows/active`
  - [ ] POST `/app/workflows/start`
  - [ ] PUT `/app/workflows/:id/step/:stepKey`
  - [ ] POST `/app/workflows/:id/step/:stepKey/submit`
  - [ ] POST `/app/workflows/:id/step/:stepKey/approve`
  - [ ] GET `/app/workflows/:id/gate-check`

### 2.5 Frontend

- [ ] Create FormationPage (`/app/formation`)
  - [ ] Stepper component showing phases
  - [ ] Step content forms
  - [ ] Progress indicators
  - [ ] Gate check warnings
  - [ ] Approval status display

### 2.6 Acceptance Criteria

- [ ] Completing setup wizard auto-starts formation workflow
- [ ] User sees formation stepper with current phase highlighted
- [ ] User can fill in step data and save progress
- [ ] User can submit step for advisor review
- [ ] Advisor can approve/reject steps
- [ ] Gate checks block progression until requirements met
- [ ] Audit log entries for all workflow actions

---

## Module 3: Artifacts + Documents

**Status:** NOT STARTED

### 3.1 Artifact Service

- [ ] Create `ArtifactService` with methods:
  - [ ] `createArtifact(tenantId, data, createdBy)`
  - [ ] `getArtifacts(tenantId, filters)`
  - [ ] `getArtifact(tenantId, artifactId)`
  - [ ] `verifyArtifact(artifactId, verifiedBy, notes)`
  - [ ] `linkArtifact(artifactId, entityType, entityId)`
  - [ ] `deleteArtifact(artifactId)`

### 3.2 API Routes

- [ ] Artifact routes:
  - [ ] GET `/app/artifacts`
  - [ ] POST `/app/artifacts`
  - [ ] GET `/app/artifacts/:id`
  - [ ] POST `/app/artifacts/:id/verify`
  - [ ] DELETE `/app/artifacts/:id`
- [ ] Document routes:
  - [ ] GET `/app/documents`
  - [ ] POST `/app/documents/generate`
  - [ ] GET `/app/documents/:id`

### 3.3 Frontend

- [ ] Create DocumentsPage (`/app/documents`)
  - [ ] Document list with filters
  - [ ] Document generation wizard
  - [ ] Upload artifact modal
  - [ ] Artifact viewer
  - [ ] Link artifact to workflow step

### 3.4 Acceptance Criteria

- [ ] User can upload artifact (screenshot, form, etc.)
- [ ] User can link artifact to workflow step
- [ ] Advisor can verify artifacts
- [ ] User can generate documents from templates
- [ ] Documents linked to business profile and workflow
- [ ] Artifacts stored with proper metadata

---

## Module 4: Tasks

**Status:** NOT STARTED

### 4.1 Task Integration

- [ ] Auto-generate tasks from workflow steps
- [ ] Link tasks to workflow instance and step

### 4.2 API Routes

- [ ] Task routes:
  - [ ] GET `/app/tasks`
  - [ ] GET `/app/tasks/today`
  - [ ] PUT `/app/tasks/:id`
  - [ ] POST `/app/tasks/:id/complete`

### 4.3 Frontend

- [ ] Create TasksPage (`/app/tasks`)
  - [ ] Task board view (Kanban)
  - [ ] Task list view
  - [ ] Task detail modal
  - [ ] Evidence attachment

### 4.4 Acceptance Criteria

- [ ] Tasks auto-created when workflow step starts
- [ ] User can view tasks for current workflow
- [ ] User can complete tasks and attach evidence
- [ ] Completing required tasks enables step submission

---

## Module 5: SIPOC Builder (FUTURE)

**Status:** NOT STARTED - DO NOT IMPLEMENT YET

---

## Module 6: DMAIC Projects (FUTURE)

**Status:** NOT STARTED - DO NOT IMPLEMENT YET

---

## Module 7: Advisor Experience

**Status:** NOT STARTED

### 7.1 Features

- [ ] Advisor workspace page
- [ ] Assigned tenants list
- [ ] Approvals queue (steps, docs, artifacts)
- [ ] Client progress overview

### 7.2 Acceptance Criteria

- [ ] Advisor sees only assigned tenants
- [ ] Advisor can approve/reject pending items
- [ ] Approval updates workflow state
- [ ] Audit log for all advisor actions

---

## Integration Checklist

- [ ] All routes use tenant isolation
- [ ] All routes use existing auth middleware
- [ ] All actions create audit log entries
- [ ] All pages show appropriate disclaimers
- [ ] Error handling consistent with existing patterns
- [ ] Loading states on all async operations
- [ ] Toast notifications for user feedback

---

## Testing Checklist

- [ ] API routes return correct status codes
- [ ] Tenant isolation enforced (cannot access other tenant data)
- [ ] Role permissions enforced (advisor vs customer)
- [ ] Workflow gates block invalid transitions
- [ ] Rules evaluate correctly for sample contexts
- [ ] UI handles error states gracefully

---

*Update this file as implementation progresses.*

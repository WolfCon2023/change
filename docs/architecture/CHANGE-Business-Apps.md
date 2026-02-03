# CHANGE Business Apps - Architecture Lock

**Version:** 1.0  
**Status:** LOCKED  
**Date:** February 2026

---

## Overview

The CHANGE Business Apps layer sits on top of the existing IAM Admin Portal and provides two core engines:

1. **Business Formation Accelerator** - Guides users through SOS registration, EIN application, and foundational documents
2. **DMAIC Business Operating System** - Operationalizes the business using Lean Six Sigma methodology

This document defines the architecture constraints and build order that must be followed.

---

## Four New Primitives

These are the ONLY new models to add. Do not duplicate existing models.

| Primitive | Purpose | Location |
|-----------|---------|----------|
| **BusinessArchetype** | Reusable business templates with processes, KPIs, docs, workflows | `business-archetype.model.ts` |
| **Rule** | Conditions and actions engine for dynamic step/task/doc requirements | `rule.model.ts` |
| **WorkflowTemplate** | Reusable workflow definitions with phases, steps, requirements | `workflow-template.model.ts` |
| **Artifact** | Evidence storage for filings, confirmations, screenshots | `artifact.model.ts` |

---

## Existing Models to Reuse

Do NOT create new versions of these. Extend if needed.

| Model | Current Use | Business Apps Use |
|-------|-------------|-------------------|
| **BusinessProfile** | Business entity data | Add `archetypeKey`, `formationStatus`, `einStatus`, `readinessFlags` |
| **Person** | Owners/officers of business | No changes needed |
| **WorkflowInstance** | Tracks workflow progress | Enhance to reference `WorkflowTemplate.key` |
| **Task** | Action items with evidence | No changes needed |
| **DocumentTemplate** | Document generation templates | No changes needed |
| **DocumentInstance** | Generated documents | No changes needed |

---

## Model Relationships

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NEW PRIMITIVES                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  BusinessArchetype ─────────────────┐                                   │
│  (seeded templates)                 │                                   │
│    - key: string                    │                                   │
│    - commonProcesses[]              │                                   │
│    - defaultKPIs[]                  │                                   │
│    - starterDocs[]                  ▼                                   │
│    - starterWorkflows[]      BusinessProfile                            │
│    - riskChecklist[]           - archetypeKey ◄────────────────────┐    │
│                                - formationStatus                   │    │
│                                - einStatus                         │    │
│  Rule ──────────────────────► - readinessFlags                     │    │
│  (conditions + actions)                 │                          │    │
│    - conditions: JSON                   │                          │    │
│    - actions: JSON                      ▼                          │    │
│    - priority: number          WorkflowInstance                    │    │
│                                  - templateKey ◄──── WorkflowTemplate   │
│                                  - stepStates{}           │             │
│  WorkflowTemplate                       │                 │             │
│  (reusable definitions)                 │           phases[]            │
│    - key: string                        │             steps[]           │
│    - phases[]                           │           requirements[]      │
│    - steps[]                            ▼                               │
│    - requirements[]              Task ◄─────────────────────────────────┤
│    - rulesHooks[]                  - workflowInstanceId                 │
│                                    - stepKey                            │
│  Artifact                              │                                │
│  (evidence storage)                    ▼                                │
│    - linkedEntityType          DocumentInstance                         │
│    - linkedEntityId              - workflowInstanceId                   │
│    - storageKey                  - businessProfileId                    │
│    - type                                                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Build Order (MUST FOLLOW)

```
Phase 1: Foundation
├── 1.1 Setup Wizard UI + API routes
├── 1.2 Seed BusinessArchetype data (12 archetypes)
└── 1.3 Update BusinessProfile with new fields

Phase 2: Workflow Engine
├── 2.1 WorkflowTemplate model + seed formation template
├── 2.2 Enhance WorkflowInstance to use templates
├── 2.3 Workflow service: start, advance, gate checks
└── 2.4 Rule model + evaluation service

Phase 3: Formation Flow
├── 3.1 Formation workflow UI (stepper)
├── 3.2 SOS preparation steps
├── 3.3 EIN preparation steps
└── 3.4 Foundational documents generation

Phase 4: Evidence
├── 4.1 Artifact model + storage
├── 4.2 Upload/link artifacts to steps
└── 4.3 Verification workflow

Phase 5: SIPOC (FUTURE)
├── 5.1 Process model
├── 5.2 SIPOC builder UI
└── 5.3 Process library from archetypes

Phase 6: DMAIC (FUTURE)
├── 6.1 DMAICProject model
├── 6.2 DMAIC workflow template
├── 6.3 KPI dashboards
└── 6.4 Control charts
```

---

## API Routes Structure

All business app routes under `/api/v1/app`:

```
/api/v1/app
├── /setup                          # Business setup wizard
│   ├── GET    /status              # Get setup progress
│   ├── POST   /start               # Start setup wizard
│   ├── PUT    /archetype           # Select archetype
│   ├── PUT    /entity-type         # Select entity type
│   ├── PUT    /state               # Select formation state
│   └── POST   /complete            # Complete setup
│
├── /archetypes                     # Archetype library (read-only)
│   ├── GET    /                    # List all archetypes
│   └── GET    /:key                # Get archetype details
│
├── /profile                        # Business profile operations
│   ├── GET    /                    # Get current profile
│   ├── PUT    /                    # Update profile
│   ├── GET    /readiness           # Get readiness flags
│   └── GET    /people              # Get owners/officers
│
├── /workflows                      # Workflow operations
│   ├── GET    /templates           # List available templates
│   ├── GET    /active              # Get active workflow
│   ├── POST   /start               # Start new workflow
│   ├── PUT    /:id/step/:stepKey   # Update step data
│   ├── POST   /:id/step/:stepKey/submit   # Submit step for review
│   ├── POST   /:id/step/:stepKey/approve  # Approve step (advisor)
│   └── GET    /:id/gate-check      # Check phase gate
│
├── /formation                      # Formation-specific
│   ├── GET    /status              # Formation progress
│   ├── PUT    /sos                 # Update SOS data
│   ├── POST   /sos/mark-filed      # Mark SOS as filed
│   ├── PUT    /ein                 # Update EIN data
│   └── POST   /ein/mark-received   # Mark EIN as received
│
├── /artifacts                      # Evidence storage
│   ├── GET    /                    # List artifacts
│   ├── POST   /                    # Upload artifact
│   ├── GET    /:id                 # Get artifact
│   ├── POST   /:id/verify          # Verify artifact (advisor)
│   └── DELETE /:id                 # Delete artifact
│
├── /tasks                          # Task operations
│   ├── GET    /                    # List tasks
│   ├── GET    /today               # Today's tasks
│   ├── PUT    /:id                 # Update task
│   └── POST   /:id/complete        # Complete task
│
├── /documents                      # Document operations
│   ├── GET    /                    # List documents
│   ├── POST   /generate            # Generate from template
│   └── GET    /:id                 # Get document
│
├── /processes                      # SIPOC (Phase 5)
│   └── (future)
│
├── /dmaic                          # DMAIC projects (Phase 6)
│   └── (future)
│
└── /dashboard                      # Dashboard data
    ├── GET    /home                # Home view data
    └── GET    /kpis                # KPI summary
```

---

## Frontend Routes Structure

All business app pages under `/app`:

```
/app
├── /home                           # Today view, next actions
├── /setup                          # Business setup wizard
├── /formation                      # Formation stepper
├── /tasks                          # Task board/list
├── /documents                      # Document repository
├── /processes                      # SIPOC builder (Phase 5)
├── /dmaic                          # DMAIC board (Phase 6)
└── /dashboards                     # KPI dashboards
```

---

## Design Principles

1. **No hardcoded industry logic** - Use seeded archetypes + rules engine
2. **Workflow-driven experience** - Users follow workflows, not manual navigation
3. **Every step produces artifacts** - Evidence trail for compliance
4. **Tenant isolation** - Every query includes tenantId filter
5. **Advisor approval gates** - Key steps require advisor sign-off
6. **Audit everything** - All actions logged for compliance

---

## Constraints

- Do NOT create new models for entities that already exist
- Do NOT implement SIPOC or DMAIC until Phases 1-4 complete
- Do NOT hardcode state-specific or entity-specific logic; use Rules
- Do NOT bypass workflow gates
- Do NOT store files locally; use artifact storage abstraction
- Do NOT provide legal or tax advice; show disclaimers

---

## Disclaimers (Required in UI)

Every formation-related page must display:

> "This system provides guidance and templates to help you organize your business formation. It does not provide legal, tax, or professional advice. Consult qualified professionals for advice specific to your situation. Filing with government agencies must be done by you directly through official channels."

---

*This architecture is LOCKED. Changes require explicit approval and documentation update.*

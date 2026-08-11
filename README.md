# APEX AERO

APEX AERO is an internal aerostructure planning and production-management application used alongside Helios ERP.

Helios remains the official source of truth for fabrication orders, operations, execution transactions, and closure status. APEX AERO converts raw Helios data into a clean, capacity-balanced workshop schedule centered on an interactive Gantt chart.

## Product purpose

APEX AERO helps three groups:

- **Planners** select active fabrication orders, balance weekly workload, assign operators, and publish the workshop schedule.
- **Operators** see assigned work and trigger official start, pause, resume, and completion transactions through the secured Helios connection.
- **Managers** see clear metrics for workload, progress, delays, capacity, quality, and rework.

The application is not a replacement for Helios ERP. It is the operational planning and visibility layer above Helios.

## First step

Before changing the application, read the domain skill:

[`/.agents/skills/apex-aero/SKILL.md`](.agents/skills/apex-aero/SKILL.md)

That file defines the product boundaries, required workflows, data ownership, task flexibility rules, Gantt behavior, Helios synchronization rules, and implementation constraints.

## Core workflow

```text
Helios CSV/blob/API data
        ↓
Import and normalize
        ↓
Filter active, non-closed fabrication orders
        ↓
Planner selects program, week, workshop, and orders
        ↓
Capacity = available operator hours, normally operators × 44 h/week
        ↓
Smart Help proposes skill-compatible assignments
        ↓
Planner adjusts and validates the Gantt schedule
        ↓
Publish assignments to workshop
        ↓
Operator executes from APEX
        ↓
APEX writes the transaction to Helios
        ↓
Helios confirms
        ↓
Gantt and management metrics update
```

## Master component: Gantt chart

The Gantt chart is the primary operating surface, not a secondary visualization.

Expected hierarchy:

```text
Program
└── Aircraft / MSN
    └── Fabrication order
        └── Configured APEX task
            ├── Helios operation
            └── Operator assignment
```

The Gantt and its supporting table must use the same dataset and remain synchronized. Planning changes must respect operator capacity, skills, dependencies, workshop calendars, and Helios execution state.

## Flexible task model

Production activities must never be hardcoded as a fixed enum.

Administrators can create and version task templates by grouping Helios operations or internal activities. For example:

```text
Task: Drilling + Riveting
Included activities:
- Drilling
- Riveting
```

A different program may keep those activities separate or group them with sealing. Existing published work must retain the template version used when it was created.

## Planner workflow

1. Open the fabrication-order database.
2. Select the planner's program and workshop scope.
3. View active, non-closed fabrication orders only.
4. Select enough work to approach weekly net capacity.
5. Review operator versatility and availability.
6. Use Smart Help for an initial assignment proposal.
7. Adjust the schedule manually in the Gantt.
8. Validate overloads, missing skills, dependencies, and due dates.
9. Publish the approved schedule.

Normal capacity starts from:

```text
weekly gross capacity = available operators × 44 hours
```

Net capacity must subtract absence, training, existing assignments, indirect work, and reserved rework capacity.

## Operator workflow

The operator sees a focused **My Work** view containing the assigned fabrication order, Helios operation identifiers, task description, planned hours, priority, and status.

When the operator clicks **Start**:

1. APEX validates assignment, skill, readiness, and authorization.
2. APEX sends a secure, idempotent start command to Helios.
3. Helios records the official transaction and returns confirmation.
4. APEX marks the task in progress only after confirmation.
5. The Gantt, operator load, and management metrics update.

The same confirmation-first rule applies to pause, resume, and completion.

## Data ownership

### Helios owns

- Official fabrication orders
- Official operation identifiers
- Aircraft/MSN and product references
- Official execution transactions
- Official completion and closure status

### APEX owns

- Import batches and normalization
- Active-order filtering
- Planner-selected workload
- Local task grouping and versioned templates
- Operator assignments
- Gantt scheduling
- Smart Help proposals
- Exceptions, alerts, notes, and management metrics

Imported Helios fields, planner-controlled fields, calculated metrics, and execution confirmations must remain distinguishable.

## Current technical state

The current repository is a React/Vite prototype using:

- React 19
- TypeScript
- Vite
- Tailwind CSS
- SQL.js
- IndexedDB browser persistence

The present data model contains simple tasks, operators, master tasks, proficiency counts, and rank settings. It does not yet implement the complete Helios integration, server-side persistence, import reconciliation, flexible activity grouping, or secure execution gateway.

## Target architecture

```text
APEX React frontend
        ↓ authenticated API
APEX backend and integration gateway
        ↓ secured enterprise connection
Helios ERP

APEX backend
        ↓
Persistent operational database
```

Helios credentials and write permissions must never be exposed in browser code.

## Development priorities

1. Helios import and reconciliation.
2. Active/non-closed fabrication-order filtering.
3. Versioned admin task builder.
4. Capacity and versatility model.
5. Stable hierarchical Gantt chart.
6. Planner publishing workflow.
7. Operator execution workflow with Helios confirmation.
8. Management KPIs and exception handling.
9. Audit history and role-based authorization.

## Local development

```bash
pnpm install
pnpm dev
```

Useful checks:

```bash
pnpm check
pnpm build
```

## Deployment

The application is deployed as a static Vite SPA on Vercel. The frontend build output is `dist/public`, with SPA routes rewritten to `index.html`.

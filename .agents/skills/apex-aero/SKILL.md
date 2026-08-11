---
name: apex-aero
description: Domain and implementation guidance for APEX AERO, an internal aerostructure planning layer integrated bidirectionally with Helios ERP. Use for product design, data modeling, Gantt planning, Helios import/sync, operator execution, capacity, versatility, task grouping, metrics, and related code changes.
---

# APEX AERO Domain Skill

## Mission

APEX AERO is an internal aerostructure planning and production-management tool used with Helios ERP.

Helios is the official enterprise system of record. APEX transforms raw Helios fabrication-order data into a clean, capacity-balanced, executable workshop schedule and returns authorized execution transactions to Helios.

The application must optimize three outcomes:

1. The planner can turn active Helios demand into a realistic weekly schedule.
2. The operator can clearly see and execute assigned work.
3. The manager can understand progress, capacity, delay, quality, and risk.

The Gantt chart is the product's master component.

## First action for every task

Before modifying code:

1. Identify which role is affected: admin, planner, operator, supervisor, quality, or manager.
2. Identify whether the data is owned by Helios, APEX, or calculated.
3. Confirm how the change affects the Gantt chart.
4. Confirm how the change behaves after the next Helios refresh.
5. Confirm that configurable production activities are not being hardcoded.

Do not implement isolated UI behavior without checking the complete planning and execution flow.

## Product boundary

### Helios owns

- Official fabrication-order identifiers and status
- Official operation identifiers and sequence
- Aircraft/MSN and product references
- Official quantities and production transactions
- Official actual start, pause, resume, completion, and closure
- Enterprise master data that Helios already governs

### APEX owns

- Import batches and normalization
- Active/non-closed order filtering
- Planner scope and workload selection
- Versioned task templates and operation grouping
- Local schedule dates and assignments
- Operator versatility and availability overlays
- Smart Help proposals
- Gantt presentation and planning scenarios
- Local notes, exceptions, warnings, and management metrics
- Audit records for APEX actions

Never silently overwrite a Helios-owned value with a planner value. Store source, local, and calculated values separately.

## Helios integration

APEX supports:

- CSV imports
- Blob/file imports
- Scheduled synchronization
- Direct API or secured connector integration
- Bidirectional execution commands

All imports must be recorded as immutable import batches with counts for:

- received rows
- accepted rows
- active orders
- closed or obsolete rows
- duplicates
- invalid rows
- new records
- changed records
- missing records

Use stable identifiers for reconciliation. Never match by display name alone.

Recommended identity:

```text
program_id + fabrication_order_id + operation_id
```

Include aircraft/MSN and work-center identifiers where required by Helios.

## Active fabrication-order rule

The planner's operational database must default to active, non-closed fabrication orders.

Exclude or separate:

- closed orders
- completed orders with no remaining work
- cancelled orders
- archived historical records
- duplicate rows from repeated exports
- invalid rows missing stable identifiers

Do not delete historical Helios data. Keep it in import history or archive views while excluding it from normal planning.

## Planner workflow

The intended planner flow is:

1. Open Fabrication Database.
2. Select the planner's program.
3. Select workshop, team, week, aircraft/MSN, or other authorized scope.
4. Review active fabrication orders and remaining workload.
5. Select fabrication orders to fill available weekly capacity.
6. Review the versatility grid.
7. Generate a Smart Help proposal when useful.
8. Adjust assignments and dates in the Gantt.
9. Validate capacity, skills, dependencies, due dates, and Helios readiness.
10. Publish the schedule to workshop users.

## Capacity rules

The default gross weekly capacity is:

```text
gross weekly capacity = available operator count × 44 hours
```

Production calculations must support a configurable standard week. Do not permanently hardcode 44 hours in business logic.

Net capacity is:

```text
net capacity = gross capacity
             - absence
             - training
             - indirect work
             - existing assignments
             - protected rework or contingency capacity
```

Show at least:

- available hours
- selected workload
- assigned workload
- unassigned workload
- remaining capacity
- load percentage
- overloaded hours

Capacity must be calculated by operator, team, workshop, program, and week when the data exists.

## Flexible production activities

Never define drilling, riveting, painting, quality, sealing, assembly, or similar activities as a closed application enum.

Administrators must be able to:

- create activities
- rename activities
- deactivate activities
- map Helios operation codes to activities
- group activities into tasks
- ungroup activities
- set order and dependencies
- define required skills
- configure duration logic
- require quality approval
- permit or forbid parallel work
- assign one operator, multiple operators, or a team
- create program/workshop-specific overrides
- version and roll back task templates

Example:

```text
Helios operation 020 → Drilling
Helios operation 030 → Riveting

APEX task template: Drilling + Riveting
```

Another program may use separate tasks. The data model must allow both.

## Recommended flexible model

Use separate concepts:

```text
Helios operation
        ↓ mapping
APEX activity definition
        ↓ grouping
Versioned APEX task template
        ↓ instantiation
Scheduled task
        ↓ assignment
Operator execution
```

Recommended entities:

- `programs`
- `aircraft_units`
- `fabrication_orders`
- `helios_operations`
- `import_batches`
- `activity_definitions`
- `helios_operation_mappings`
- `task_templates`
- `task_template_versions`
- `task_template_activities`
- `scheduled_tasks`
- `task_operation_links`
- `operators`
- `skills`
- `operator_skills`
- `operator_availability`
- `assignments`
- `execution_commands`
- `execution_events`
- `quality_events`
- `rework_events`
- `audit_events`

Avoid storing all concepts in one generic task row.

## Template versioning

Editing an admin template must not mutate historical or in-progress work.

When a template is published:

- create an immutable version
- attach new scheduled tasks to that version
- store a configuration snapshot on the scheduled task when appropriate
- archive old versions instead of deleting them

Example:

```text
Version 1: Drilling + Riveting
Version 2: Drilling + Riveting + Sealing
```

Published tasks using version 1 remain unchanged.

## Completion and progress rules

Grouped tasks require configurable rules:

- all linked operations completed
- weighted progress
- sequential completion
- parallel completion
- manual supervisor approval
- quality approval required

Example weighted progress:

```text
Drilling = 40%
Riveting = 60%
```

Do not infer progress solely from elapsed time when Helios operation events exist.

## Duration rules

Support configurable duration strategies:

- sum of remaining Helios hours
- maximum parallel duration
- administrator-defined standard duration
- quantity × standard time
- planner override with reason

Show source and planner values separately:

```text
Helios remaining workload: 14 h
APEX planned duration: 12 h
Variance: -2 h
```

## Versatility grid

The versatility grid connects operators, configurable tasks, activities, and skills.

For each operator show, where available:

- qualifications
- proficiency/rank
- completed-task count
- program authorization
- workshop eligibility
- weekly availability
- assigned hours
- remaining hours
- restrictions or expiration dates

Current rank logic may be retained as a presentation aid, but assignment eligibility must use explicit skill and authorization rules when those are available.

## Smart Help

Smart Help provides proposals and explanations. The planner remains responsible for publication.

Inputs may include:

- selected fabrication orders
- open Helios operations
- remaining workload
- task-template configuration
- required skills
- operator availability
- current assignments
- dependencies
- due dates
- program priority
- work-center capacity
- quality or rework constraints

Outputs should include:

- proposed operator or team
- proposed dates
- workload balance
- unassigned tasks
- overloads
- missing skills
- dependency conflicts
- explanation for each recommendation

Prefer deterministic constraint logic for feasibility. AI may rank, explain, or propose alternatives, but must not invent Helios data or bypass hard constraints.

## Gantt requirements

The Gantt is the canonical planning view.

Preferred hierarchy:

```text
Program
└── Aircraft / MSN
    └── Fabrication order
        └── APEX scheduled task
            ├── Helios operation
            └── operator assignment
```

Required behavior:

- collapse and expand hierarchy
- keep table and timeline synchronized
- filter by program, order, operator, status, workshop, and quality
- show planned versus actual time
- show critical, late, blocked, and overloaded states
- show dependencies
- support safe drag and resize
- validate skill, capacity, calendar, and dependency constraints
- preserve an audit record of manual schedule changes

Never calculate business truth only from pixel positions. Persist normalized dates, hours, and assignments.

## Publishing

Use an explicit lifecycle:

```text
draft → validated → published → seen → ready → starting → in_progress
      → paused → completing → completed
```

Also support:

```text
blocked
cancelled
sync_failed
```

Publishing must freeze or snapshot the relevant configuration and make the work visible to authorized workshop users.

## Operator execution

The operator's primary screen is **My Work**.

Show only relevant operational information:

- fabrication-order ID
- Helios operation ID
- aircraft/MSN
- task name and activities
- planned hours
- sequence and priority
- planner notes
- current APEX status
- current Helios status

For Start, Pause, Resume, or Complete:

1. Validate identity and authorization.
2. Validate assignment and task readiness.
3. Create an idempotent execution command.
4. Send it through the secured backend/integration gateway.
5. Wait for Helios confirmation.
6. Record the Helios transaction ID and official timestamp.
7. Update APEX status and metrics.

Do not show success before Helios confirms the official transaction.

## Idempotency and retries

Execution commands must be safe against double-clicks and network retries.

Recommended key:

```text
action:fabrication_order_id:operation_id:assignment_id
```

Retries must reuse the command identity. Never create duplicate Helios transactions.

If Helios is unavailable, show a clear pending or failed state. Do not pretend that execution started.

## Security

The browser must never contain:

- Helios credentials
- Helios database credentials
- privileged API tokens
- unrestricted integration secrets

Use:

```text
React frontend
    ↓ authenticated request
APEX backend/integration gateway
    ↓ secured Helios connection
Helios ERP
```

Implement role-based access for admin, planner, operator, supervisor, quality, and manager roles.

Server-side authorization is mandatory for write operations.

## Management metrics

Metrics must be calculated from normalized, traceable data.

Priority KPIs:

- active fabrication orders
- late fabrication orders
- open operations
- selected versus available weekly load
- assigned versus unassigned hours
- planned versus actual hours
- schedule adherence
- work-center load
- blocked operations
- rework hours and count
- completion forecast
- Helios/APEX reconciliation exceptions
- latest data freshness

Every metric should support drill-down to the underlying orders, tasks, assignments, or events.

## Reconciliation exceptions

Surface exceptions instead of silently overwriting conflicts:

- Helios order closed while APEX work remains scheduled
- Helios operation started without an APEX assignment
- assigned operator differs from the Helios operator
- actual hours exceed plan
- operation missing after refresh
- command accepted locally but not confirmed by Helios
- duplicate or changed operation identity
- task template no longer maps cleanly to imported operations

## Current repository constraints

The current implementation is a frontend prototype:

- React/Vite application
- SQL.js database in the browser
- IndexedDB persistence
- simple `Task` and `MasterTask` interfaces
- proficiency based largely on completed-task counts

When evolving the system:

- do not disguise browser-local persistence as enterprise persistence
- do not place Helios write logic in React components
- introduce backend contracts before production integration
- migrate existing prototype data deliberately
- preserve working Gantt behavior while replacing the data layer incrementally

## Coding rules

- Prefer domain-specific types over loose strings.
- Keep imported, local, and calculated fields distinct.
- Use stable IDs; names are display values.
- Make week length and thresholds configurable.
- Avoid hardcoded programs, activities, skills, workshops, and statuses tied to one dataset.
- Keep scheduling functions deterministic and testable.
- Keep Helios adapters behind interfaces.
- Log every external command and response safely.
- Add validation at import, API, and database boundaries.
- Make failure states visible to users.
- Preserve accessibility for keyboard and screen-reader users.

## Validation checklist

Before completing a change, verify:

- Does it preserve Helios as the official source of truth?
- Does it support active/non-closed order filtering?
- Does it avoid hardcoding production activities?
- Does it preserve task-template version history?
- Does it respect capacity and skill constraints?
- Does it update or integrate correctly with the Gantt?
- Does it distinguish local status from Helios status?
- Are execution writes confirmation-first and idempotent?
- Are secrets kept server-side?
- Can the user understand failures and reconciliation conflicts?
- Can managers drill down from metrics to source records?

## Product definition

Use this definition when explaining the application:

> APEX AERO is an internal aerostructure planning and production-visibility platform that converts active Helios ERP fabrication orders into a flexible, capacity-balanced workshop schedule, centered on an interactive Gantt chart, and lets authorized operators execute confirmed Helios transactions directly from APEX.

# Agent Skill Routing and Incremental Delivery Protocol

This file defines how coding agents discover and compose skills, turn the product agenda into executable tasks, and deliver each task through both automated and human-visible validation. It complements `AGENTS.md`; it does not grant new permissions.

## 1. Skill discovery order

For every new task:

1. Read `PROJECT.md`, `AGENTS.md`, this file, and the relevant part of `agenda.md`.
2. Inspect the currently available environment skills and project-local `skills/*/SKILL.md` files.
3. Select only skills whose descriptions match the requested output or operation.
4. Read each selected `SKILL.md` completely before implementation. Read linked references only when routed by that skill and relevant to the task.
5. Record the chosen skills and why they apply in `tasks/<task-id>/task.md`.
6. If no matching skill exists, use the project protocol below. Do not invent a skill invocation or treat a similarly named skill as equivalent.

## 2. Skill routing table

| Trigger or deliverable | Preferred project skill | Additional validator or environment capability |
| --- | --- | --- |
| Build or update the verified master profile | `build-profile` | Schema validation and user confirmation of conflicts |
| Discover current jobs | `find-jobs` | Source availability, canonical URL, timestamp, and deduplication checks |
| Score or recommend a job | `score-fit` | Hard-condition fixtures and evidence traceability tests |
| Tailor a resume | `tailor-resume` | DOCX revision inspection and claim-source audit |
| Render a resume | `render-resume` | `review-render`, extracted-text comparison, and all-page visual review |
| Prepare a cover letter | `write-cover-letter` | Profile/job evidence audit and length/format checks |
| Answer application questions | `answer-application-questions` | Type/length rules and explicit declaration handling |
| Complete the full application preparation pipeline | `apply-to-job` | Component-level validation plus approval checks |
| Research a company or role | `research-company` | Cited-source and freshness review |
| Prepare or practice interviews | `prep-interview`, `mock-interview` | Evidence-linked STAR checks and rubric validation |
| Infer application status | `triage-inbox`, `infer-status` | Canonical status-transition tests; mailbox authorization remains separate |
| Draft recruiting communication | `draft-reply` or `write-outreach` | Recipient/content review and explicit send authorization |
| Create or revise a reusable skill | Environment `skill-creator` | Skill quick validator and, when warranted, independent behavior test |
| Build or change the local GUI | No project business skill by default | Existing unit/integration tests plus `webapp-testing` or browser automation when available |
| Validate a Word/PDF artifact | `review-render` plus relevant render skill | Document/PDF tooling, extracted text, and page screenshots |

All project job skills must obey `skills/_shared/RULES.md`. Use region and work-authorization references when the output depends on geography.

## 3. Task folder and Markdown-first contract

Create a stable folder for each implementation task:

```text
tasks/<task-id>/
|-- task.md                 Required plan, status, and evidence
|-- fixtures/               Optional fictional test data
|-- evidence/               Optional screenshots or validation summaries
`-- notes/                  Optional investigation notes that should not enter product output
```

Do not create optional directories until the task needs them. Product code remains in its normal project directory; the task folder holds planning and evidence, not duplicate implementations.

Use a lowercase, hyphenated task ID such as `review-package-approval`.

## 4. Required task template

Each `task.md` must contain:

```markdown
# <Task title>

Status: planned
Owner: agent/user
Agenda link: <section>

## Outcome
One observable user outcome.

## Scope
- Included behavior
- Included artifacts

## Non-goals
- Explicitly excluded behavior and external actions

## Inputs and dependencies
- Existing files, schemas, services, and prerequisite task evidence
- User decisions or permissions still required

## Skill routing
- Skill: why it is used
- Validator: why it is used

## Design and data contract
- State transitions, schemas, hashes/versions, error states, and security boundaries

## Settings and folders
- Configuration additions with defaults and validation
- Directories/files to create or update

## GUI behavior
- Entry point, states, actions, errors, accessibility, and human-visible evidence

## Implementation steps
1. Small dependency-ordered step
2. Next step

## Automated acceptance
- Given/When/Then behavior or measurable invariant
- Exact validation commands

## Human validation
- Browser steps and expected visible results
- Documents/pages/files to inspect

## Approval gates
- Action requiring approval, its exact scope, and invalidation rule

## Recovery and rollback
- Partial-state preservation, retry rule, and safe recovery path

## Evidence and result
- Changed files
- Test results
- Screenshots/artifacts
- Known limitations and next task
```

The task document begins as the design contract and is updated with real evidence during implementation. Do not rewrite failed checks as successful outcomes.

## 5. Incremental delivery workflow

### Step 1 — Define

- Translate one agenda item into one observable outcome.
- Write the task Markdown before product-code changes.
- Identify non-goals and approval boundaries.
- Check existing implementation and user changes before choosing files to edit.

### Step 2 — Route skills

- Discover available skills instead of relying on memory.
- Choose the narrowest applicable skills and validators.
- Record selection in the task file. If a skill changes the workflow, surface that fact to the user.

### Step 3 — Design contracts

- Define data schema, state transitions, version/hash rules, errors, privacy boundaries, and UI states.
- Reuse existing sidecars and canonical paths where applicable.
- Specify success, empty, loading, stale, invalidated, unauthorized, and failure states.

### Step 4 — Create settings and folders

- Add only settings required for this task, with safe defaults and input validation.
- Create only necessary folders. Preserve original jobs, resumes, and previous outputs.
- Treat saved settings as configuration, never as application approval.

### Step 5 — Implement the smallest vertical slice

- Build backend/data behavior first or alongside a thin GUI path.
- Connect the real GUI to real local data; do not display invented successful states.
- Preserve compatibility or add a deliberate migration with tests.

### Step 6 — Automated validation

- Run syntax/schema checks.
- Test the primary behavior and meaningful invariants.
- Test empty, stale, invalid, unauthorized, changed-version, and failure paths when relevant.
- Run focused regression tests for touched modules.
- Use fictional data for application, approval, and submission tests.

### Step 7 — GUI and artifact validation

- Start or reuse the local service and verify its HTTP/API response.
- Validate the GUI in a browser at realistic viewport sizes; inspect errors and accessibility-relevant states.
- For DOCX/PDF outputs, inspect structure, extracted text, every rendered page, links, revision marks, and page constraints.
- Capture durable evidence when it helps the user reproduce the result.

### Step 8 — Human validation gate

- Present the GUI or artifact to the user with a short checklist of what to verify.
- Keep the task at `ready_for_human_validation` when subjective appearance, correctness, or a consequential decision needs the user.
- Human validation does not automatically authorize external upload, submission, messaging, deletion, or scheduling.

### Step 9 — Approval and external action

- Prepare the concrete job, destination, immutable files/answers, action scope, and limitations before asking for approval.
- Bind approval to job identity, versions/hashes, answers, destination, and action.
- Keep upload/save, submission, and communication as distinct actions unless one explicit approval precisely covers them.
- Stop for login, MFA, CAPTCHA, declarations, unexpected questions, or changed materials.

### Step 10 — Record and advance

- Update the task evidence and status.
- Update `outputs/results.json` and `RUN_STATUS.md` with real results while preserving history.
- Present the local GUI after a completed run.
- Start the next task only when dependencies and the exit criteria are satisfied.

## 6. Validation standard

A task is complete only when all applicable layers pass:

| Layer | Minimum evidence |
| --- | --- |
| Contract | Task Markdown matches implemented scope, states, and permissions |
| Data | Schema/path/version validation; no silent destructive migration |
| Behavior | Focused tests exercise observable outcomes, not headings or superficial strings |
| Safety | Permission, privacy, unsupported-claim, invalidation, duplicate, and uncertain-outcome checks as applicable |
| Failure | Empty, unavailable, invalid, stale, or partial state has an honest recovery path |
| GUI | Browser-verified controls, visible evidence, error states, and usable navigation |
| Artifact | Structural, extracted-text, and all-page visual checks for DOCX/PDF/media |
| Regression | Relevant existing tests still pass |
| Human | User can inspect the result in the GUI; unresolved subjective issues remain clearly pending |
| Record | Task file, `RUN_STATUS.md`, and `outputs/results.json` reflect actual results |

Automated checks and human GUI review are complementary. Neither substitutes for the other.

## 7. Task-design validation choice

There is no current project-local skill dedicated solely to software task design. Use this protocol for task construction and use specialized skills for the artifact or domain being built. Prefer internal/domain validators because they understand project invariants:

- Job and resume correctness: project JobClaw skills and shared rules
- DOCX/PDF correctness: render/review skills plus document tools
- GUI correctness: project tests plus browser/webapp testing
- New reusable workflow skill: skill-creator plus quick validation

Create a dedicated `delivery-task` skill later only if repeated executions demonstrate that this protocol needs reusable scripts, schemas, or automatic checks. Do not create one merely to duplicate this document.

## 8. First task to build next

Create `tasks/review-package-approval/task.md` and implement the agenda's Review Package milestone as the first vertical slice. It should display one verified job, its assessment, exact application artifacts and hashes, gaps/unknowns, prior application history, and separate local approval scopes. This task must not upload or submit anything; its exit gate is an immutable, invalidatable local review record that the user can inspect in the GUI.

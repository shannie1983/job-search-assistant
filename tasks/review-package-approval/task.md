# Review Package and Local Approval Record

Status: planned  
Owner: agent/user  
Agenda link: `agenda.md` sections 5E, 8 Phase 3, and 12

## Outcome

The user can open one verified job in the local GUI, inspect the exact evidence-backed application package and its limitations, and create a local, immutable approval record whose scope and invalidation state are visible. This task performs no external upload or submission.

## Scope

- Add a Review Package GUI entry point for one selected verified job.
- Display job identity, source, availability/freshness, assessment, strengths, gaps, unknowns, and prior application history.
- Display exact resume DOCX/PDF, tailoring report, keyword mapping, cover letter, and application answers when present.
- Calculate SHA-256 hashes for job snapshot, attachments, and answer set.
- Store a versioned local review record and optional approval scope.
- Support separate `upload` and `submit` scopes, with invalidation after substantive changes.

## Non-goals

- No employer-site navigation, form save, upload, submission, email, or outreach.
- No CAPTCHA, login, MFA, or credential handling.
- No invention of missing documents, answers, job facts, or approval.
- No replacement of the selected master resume or deletion of previous outputs.

## Inputs and dependencies

- `agenda.md`, `AGENTS.md`, `AGENTSKILL.md`, `PERMISSIONS_AND_WORKFLOW.md`
- One verified job record and current posting snapshot
- Current match assessment tied to the posting/profile/resume versions
- Existing tailored artifacts when available
- Stable schemas for package, approval, and application events; if absent, define them within this task before GUI implementation
- No external-action permission is required for this local milestone

## Skill routing

- `score-fit`: interpret and display the evidence-backed assessment and hard-condition results.
- `tailor-resume`: understand tailoring sidecar provenance and unsupported gaps.
- `render-resume` and `review-render`: validate referenced resume outputs when a package includes them.
- Project GUI tests plus environment web-application/browser testing: validate the human review surface.
- Do not use `apply-to-job` to perform an application; this task implements only the local review/approval segment.

## Design and data contract

Define versioned schemas for:

- `application_package`: package ID, job ID, posting snapshot hash, assessment ID/hash, profile/resume version, artifacts with paths/types/hashes, answer-set hash, gaps, unknowns, created time, and status.
- `approval_record`: approval ID, package ID/hash, requested scope, granted scope, timestamp, authorization evidence, invalidated time/reason, and current validity.
- `application_event`: append-only event ID, job/package/approval IDs, operation, time, result, and failure reason without sensitive answer content.

Rules:

- Only exact file contents determine attachment hashes.
- Changing job identity/content, attachments, answers, destination, or scope invalidates the related approval.
- Removing review marks without changing approved clean content does not invalidate the clean attachment hash.
- Unverified/stale jobs may be reviewed but cannot be approved for application action.
- Previous applications remain visible and block duplicate application approval unless the user explicitly resolves the record.

## Settings and folders

- Reuse existing configuration when possible; do not create an “auto approve” setting.
- Proposed product data paths:
  - `data/applications/packages/<package-id>.json`
  - `data/applications/approvals/<approval-id>.json`
  - `data/events/application-events.jsonl`
- Preserve all earlier records. Add schema version fields for future migrations.

## GUI behavior

- Add `Review Package` to the minimum core navigation or as a clear action from a job card.
- Show loading, incomplete, unverified, stale, invalidated, ready, and error states.
- Show filenames, types, hashes, versions, generated times, and validation state.
- Provide file preview/download links only through safe local routes that do not expose arbitrary personal files.
- Present separate local controls for proposed `upload` and `submit` approval scopes.
- Require an explicit confirmation summary; never preselect approval.
- Display an approval receipt and any later invalidation reason.
- Keep controls keyboard reachable, labels explicit, focus visible, and errors associated with the relevant field/action.

## Implementation steps

1. Inspect existing job, assessment, tailoring, application, and GUI data contracts.
2. Define package/approval/event schemas and fictional fixtures.
3. Implement deterministic hashing and package assembly without external actions.
4. Implement approval creation, scope enforcement, invalidation, and duplicate blocking.
5. Add read-only API endpoints, then local approval mutation endpoints.
6. Add the Review Package GUI states and accessible controls.
7. Connect one fictional package and one real local verified-job package without inventing missing artifacts.
8. Run automated tests, browser validation, security checks, and focused regressions.
9. Present the GUI for human validation.
10. Record real results in this file, `RUN_STATUS.md`, and `outputs/results.json`.

## Automated acceptance

- Given unchanged inputs, rebuilding the same package produces the same content hashes.
- Given any substantive input change, the prior approval becomes invalid with a recorded reason.
- Given an unverified/stale job, approval creation is rejected while review remains available.
- Given a prior submitted application, duplicate approval is blocked and the prior record is linked.
- Given requested `upload` scope, the record does not imply `submit` scope.
- Given no cover letter or answer set, the GUI reports “not required/not available” rather than fabricating content.
- Given path traversal or an arbitrary personal-file path, the preview route denies access.
- Syntax, schema, focused unit/integration, and relevant existing regression tests pass.

Exact commands will be filled in after implementation paths and test runners are confirmed.

## Human validation

In the local GUI, the user should verify:

1. The displayed company, role, URL, freshness, and recommendation match the selected record.
2. Every listed artifact opens as the expected version.
3. Strengths, gaps, unknowns, and prior application state are understandable.
4. Upload and submit scopes are clearly distinct.
5. Changing a fixture/package input visibly invalidates the old approval.
6. Empty, stale, missing-file, and failure states explain the next action.
7. The page is usable by keyboard and at desktop and narrow viewport sizes.

## Approval gates

- Creating a local approval record is not an external application action.
- Any later employer form save/upload requires approval bound to the job, destination, exact files/answers, and upload scope.
- Submission requires a separate confirmation unless one explicit approval precisely covers upload and submission for the unchanged package.
- Messaging requires separate recipient/content authorization.

## Recovery and rollback

- Preserve append-only event and prior approval records; mark invalid instead of deleting.
- On interrupted package assembly, leave a failed/incomplete record with the recoverable next action.
- Do not retry an uncertain external action because this task performs none.
- UI rollback must not remove stored history or reinterpret earlier approval scope.

## Evidence and result

- Changed files: this planning document only.
- Test results: not run; implementation has not started.
- Screenshots/artifacts: none yet.
- Known limitation: schemas, endpoints, GUI, and automated tests described above remain planned.
- Next task action: inspect current data contracts and convert this task from `planned` to `in_progress` before making product-code changes.

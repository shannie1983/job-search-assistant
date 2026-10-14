# Backend Center Rewrite with Frontend Contract Preservation

Status: ready_for_human_validation  
Owner: agent/user  
Agenda link: `agenda.md` sections 6–7 and `AGENTSKILL.md` incremental delivery workflow

## Outcome

Rebuild and centralize the local backend entry points so every API and file link used by the existing GUI resolves to the correct handler and data source, while preserving the current frontend files, settings, layout, labels, and interaction contracts.

## Scope

- Inventory every frontend HTTP call and downloadable/static link in `gui/` and `interview/`.
- Define one explicit route contract for the main GUI and proxied Interview Studio.
- Rewrite the main and interview backend entry points around deterministic routing, shared response/body helpers, safe local file resolution, and consistent errors.
- Preserve existing business modules unless an observed contract defect requires a focused correction.
- Run all existing Node/Python tests, API contract probes, and browser validation.
- Update operational documentation and run records with real results.

## Non-goals

- No change to `gui/index.html`, `gui/tailor-ui.js`, `gui/master-resume-ui.js`, `interview/index.html`, `interview/app.js`, or CSS unless the unchanged frontend proves impossible to serve correctly; any such conflict must be reported before editing.
- No visual redesign, renamed control, changed preference default, invented data, job application, upload to an employer, submission, email, or recurring schedule.
- No destructive rewrite of personal files, prior outputs, or stored interview sessions.

## Inputs and dependencies

- Existing GUI on `http://127.0.0.1:8765/` and Interview Studio service on `127.0.0.1:8770`.
- Current `gui/server.cjs`, `interview/server.cjs`, business modules, tests, JSON stores, and Python document helpers.
- Frontend source is the compatibility contract; its content hash will be recorded before and after backend work.
- Network-backed job search may remain environment-dependent; local routing and failure behavior must still validate.

## Skill routing

- `webapp-testing`: browser reconnaissance, console/network validation, and screenshots after backend changes.
- Project protocol in `AGENTSKILL.md`: task design, automated validation, human GUI gate, and run recording.
- Project job skills are not invoked because this task changes application infrastructure rather than generating job artifacts.

## Design and data contract

- Route matching uses method plus parsed pathname, never fragile raw-URL equality when queries are allowed.
- JSON responses use consistent content type, status, and `{error}` messages on failure.
- Request bodies enforce explicit size limits and reject malformed JSON with HTTP 400.
- Static/download routes resolve only inside allowlisted project roots and reject traversal.
- Main GUI continues to serve `/`, current scripts, `/api/*`, downloads, and `/interview/*` with the same frontend-visible URLs.
- Interview proxy preserves method, body, safe headers, status, and content type.
- Unknown routes return 404; unexpected backend failures return 500 without exposing secrets or stack traces.
- Stored settings remain configuration only and are not interpreted as approval.

## Settings and folders

- Preserve current ports and localhost binding: main `8765`, interview `8770`.
- Preserve `config/preferences.json`, ratings, results, drafts, uploads, sessions, and final documents.
- Add backend helper modules or route-contract evidence only where needed; do not relocate personal data.

## GUI behavior

- Current navigation, controls, values, saved preferences, job cards, Tailor CV, tracking, alerts, and embedded Interview Studio remain visually and behaviorally compatible.
- All frontend fetches receive the expected status and response shape.
- Download and document links resolve or show an honest current limitation.
- Browser console contains no new errors during core navigation.

## Implementation steps

1. Record frontend file hashes and extract the complete frontend-to-backend route inventory.
2. Map current handlers, stores, static paths, and proxy paths; run the baseline test suite.
3. Define route-contract fixtures and backend helper boundaries.
4. Rewrite backend entry points without editing frontend assets.
5. Run syntax, unit, Python, API contract, traversal, malformed-body, and regression tests.
6. Restart/reuse services and run browser validation across all navigation areas.
7. Compare frontend hashes, record evidence, update run history, and present the GUI for human validation.

## Automated acceptance

- Frontend file hashes are identical before and after the backend rewrite.
- Every statically discoverable frontend API call maps to a backend route or documented proxy route.
- `/`, `/api/state`, document/settings/rating/search/tailor/tracking/alert endpoints and `/interview/` return contract-compatible responses.
- Malformed JSON, oversized body, unknown route, missing file, and traversal probes return bounded 4xx responses rather than crashing or exposing files.
- All relevant existing Node and Python tests pass.
- Both server entry points pass syntax checks and bind only to localhost.

## Human validation

The user will validate in the unchanged GUI:

1. Existing preferences and saved values remain present.
2. All navigation items open correctly.
3. Job matching, ratings, Tailor CV drafts/files, tracking, schedules, and documents load.
4. Embedded Interview Studio loads and its sections retain saved data.
5. No visual settings, labels, or layout changed.
6. Errors, if any, identify a recoverable action rather than silently failing.

## Approval gates

- This local backend rewrite needs no external-action approval.
- Employer uploads/submissions, email, outreach, scheduling activation, deletion, and master overwrite remain separately blocked.

## Recovery and rollback

- Preserve all existing data files and outputs.
- Do not delete old modules during this task; focused replacements remain recoverable through version control/user backups.
- If a route cannot be preserved safely, leave the task partial, record the route and failure, and keep the current working handler.

## Evidence and result

- Changed files: `backend/http.cjs`, `backend/route-contract.cjs`, `backend/http.test.cjs`, `gui/server.cjs`, `interview/server.cjs`, and this task record.
- Backend architecture: both server entry points now identify through the shared backend center; explicit main/interview route manifests and `/api/health` endpoints were added. Shared helpers provide parsed URLs, consistent JSON/no-cache/nosniff responses, bounded bodies, parameterized content-type handling, loopback-origin validation, and public error mapping.
- Test results: all 57 Node tests and 2 Python document tests passed after the rewrite. Syntax checks passed for both servers and backend-center modules.
- Live API results: main health, interview health, main state, proxied interview health/inventory, and embedded interview HTML returned HTTP 200. Unknown route and document path-traversal probes returned HTTP 404.
- Service binding: main and interview services restarted successfully and listen only on `127.0.0.1:8765` and `127.0.0.1:8770`.
- Frontend hash comparison: protected frontend files remained unchanged—`gui/index.html`, `gui/tailor-ui.js`, `gui/master-resume-ui.js`, `interview/index.html`, `interview/app.js`, and `interview/style.css` retained their SHA-256 hashes.
- GUI/browser evidence: the unchanged Overview rendered saved preferences, two current matches, scheduling and tracking controls; the embedded Interview Studio rendered through `/interview/` with saved job context and all seven sections.
- Human gate: the validated local GUI is presented for the user's visual/interaction confirmation.
- Known limitation: external job sources and local Ollama/microphone availability may fail independently of local backend routing correctness.

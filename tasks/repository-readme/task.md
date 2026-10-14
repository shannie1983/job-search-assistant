# Repository README

Status: complete
Owner: agent/user
Agenda link: repository delivery and operational readiness

## Outcome

Add a concise root README that lets a new reader understand, install, run, test, and safely evaluate the local job-search assistant.

## Scope

- Explain the product, implemented workflows, local architecture, privacy boundaries, setup, usage, tests, and limitations.
- Link to the detailed project and runtime documentation already in the repository.

## Non-goals

- No product-code, configuration, dependency, or runtime behavior changes.
- No claims that unimplemented application submission or scheduling features are complete.

## Inputs and dependencies

- `PROJECT.md`, `agenda.md`, `gui/README.md`, `interview/README.md`, `docs/RUNTIMES.md`, and `package.json`.
- Current verified test commands and private-publication boundary.

## Skill routing

- `doc-coauthoring`: structure the document around reader needs and test it for missing context.

## Design and data contract

- The README is an orientation document; detailed behavior and policy remain canonical in linked project files.
- Personal inputs, generated outputs, credentials, and runtime state must be described as local and ignored by Git.

## Settings and folders

- Add only `/README.md` and this task record.

## GUI behavior

- Document the main GUI at `http://127.0.0.1:8765` and Interview Studio at `http://127.0.0.1:8770`.

## Implementation steps

1. Derive an accurate newcomer-oriented structure from existing documentation.
2. Write the root README.
3. validate links, commands, privacy claims, and Markdown consistency.
4. Commit and push the documentation update to the existing private repository.

## Automated acceptance

- Every relative Markdown link resolves to an existing tracked path.
- Documented test commands pass.
- `README.md` contains no personal paths, credentials, or generated job data.

## Human validation

- Review the rendered README on GitHub for clarity and formatting.

## Approval gates

- The user's request authorizes creating and publishing this documentation update to the existing private repository.

## Recovery and rollback

- Revert the documentation commit if the README misstates behavior; no product state is changed.

## Evidence and result

- Added a 156-line root `README.md` covering purpose, authorship, implemented workflows, privacy, setup, usage, tests, structure, skills, and limitations.
- All 10 relative Markdown links resolve to existing repository paths.
- Privacy scan found no personal absolute paths, API keys, or GitHub tokens.
- Validation passed: 57 Node tests and 2 Python document tests.
- A context-isolated reader correctly answered the product, startup, privacy, submission, testing, OpenAI, and limitation questions; its ambiguity findings were incorporated.

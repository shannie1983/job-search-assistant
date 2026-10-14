# Job Search Assistant

A local-first workspace for finding jobs, evaluating fit against verified experience, tailoring Word resumes, and practicing interviews while keeping consequential actions under human control.

Created by Zeng using Codex.

The project combines a browser-based job-search dashboard, evidence-aware CV tooling, an interview practice studio, and reusable Agent Skills. It is designed to preserve original source materials, distinguish verified facts from unknowns, and require explicit approval before uploads, submissions, or outreach.

> [!IMPORTANT]
> This is an actively developed personal workflow, not a fully autonomous application bot. Discovery, scoring, CV review, and interview preparation are implemented. Scheduled execution and employer submission automation are not complete.

## What it does

- Searches supported public job sources and stores deduplicated results locally.
- Applies hard-condition checks before ranking jobs by documented experience fit.
- Keeps AI fit scores separate from the owner's 1–5 star preferences.
- Builds reviewable DOCX resume variants with genuine Word insert/delete revisions and optional keyword highlighting.
- Supports local rule-based tailoring or an optional session-only OpenAI API key.
- Provides evidence-linked interview preparation, local voice practice, transcription, and coaching.
- Records limitations and unknowns instead of treating missing evidence as a match.

## Safety and privacy

The application listens on loopback interfaces and keeps working data on the local computer. Git ignores personal source documents, generated applications, recordings, real preferences, profiles, credentials, and run history.

The repository does **not** treat saved settings as permission to upload or submit anything. Employer uploads, application submissions, email, and outreach require separate, specific authorization. OpenAI-powered tailoring is optional; selecting the OpenAI method in **Tailor CV** and clicking **Prepare CV changes** sends the chosen CV text and job description to the OpenAI Responses API. The API key remains in server memory and is not written to the normal project configuration.

See [PERMISSIONS_AND_WORKFLOW.md](PERMISSIONS_AND_WORKFLOW.md) for the complete action and approval model.

## Requirements

- Node.js
- Python 3
- A modern browser
- Microsoft Word or another DOCX-compatible editor for tracked-change review

Optional components:

- [Ollama](https://ollama.com/) with `qwen3:4b` for local interview coaching
- `faster-whisper` for local recorded-answer transcription
- An OpenAI API key for optional AI-assisted CV rewriting
- LibreOffice for automated document rendering and page-layout checks

The dashboard and core tests run without these optional components. Python is used by the DOCX workflow; transcription has its own local `faster-whisper` environment as described in [interview/README.md](interview/README.md).

## Quick start

Install the Node dependency from the repository root:

```powershell
npm install
```

Start the main application:

```powershell
node gui/server.cjs
```

Open [http://127.0.0.1:8765](http://127.0.0.1:8765).

For interview features, start the second local service in another terminal:

```powershell
node interview/server.cjs
```

Interview Studio is available at [http://127.0.0.1:8770](http://127.0.0.1:8770) and is also embedded in the main application's interview tab.

## First-time setup

1. Open **Preferences** and configure target roles, keywords, locations, and other constraints.
2. Select a clean DOCX master resume, or import one into the local workspace. This local import does not send the file to an employer or cloud service. Importing a file alone does not change the saved default; save the preferences explicitly.
3. Use **Search internet now** to retrieve supported listings from Remotive and, when configured, USAJOBS. Saved-board links are available for manual discovery but are not automatically imported. USAJOBS requires `USAJOBS_API_KEY` and `USAJOBS_EMAIL` in the server environment before the main server starts.
4. Review hard conditions, evidence, gaps, and location eligibility before acting on a recommendation.
5. Open **Tailor CV**, choose a job and source resume, then review every proposed change before exporting.
6. Start Interview Studio when you want role-specific preparation or practice.

Never place credentials in repository files. Use environment variables or the session-only controls exposed by the local application.

## Resume workflow

The tailoring workflow produces versioned local files under the ignored `outputs/` directory:

- `cv_tracked_highlighted.docx` — tracked revisions plus selected keyword highlights
- `cv_tracked.docx` — tracked revisions without highlights
- `cv_final.docx` — accepted GUI edits without revision marks or highlights

The browser editor is an approximation of the document's text structure. Review the exported files in Word before using them. Page count and layout are only verified when a compatible renderer is installed.

## Interview workflow

Interview Studio can build an evidence-linked question set, STAR prompts, a preparation checklist, and questions to ask the interviewer. Typed or recorded answers can be scored by a local Ollama model. Optional transcription uses a local Whisper model. Saved recordings live under the Git-ignored `outputs/interview/recordings/` directory.

Microphone and camera access occurs only after an explicit click. Media remains local and is not used for emotion, identity, or hiring-suitability analysis. Hardware capture still depends on browser permission and an available input device.

## Tests

Run the JavaScript test suite from the repository root:

```powershell
node --test
```

Run the DOCX tests from the `gui` directory:

```powershell
Set-Location gui
python -m unittest cv_document_test.py
```

The baseline validated on 2026-10-14 is 57 passing Node tests and 2 passing Python document tests.

## Project structure

```text
backend/      Shared HTTP and route contracts
config/       Sanitized configuration examples; real settings are ignored
docs/         Workflow and runtime documentation
gui/          Main dashboard, matching, and CV tooling
interview/    Interview preparation and practice service
knowledge/    Schemas, taxonomies, and domain guidance
profile/      Sanitized profile templates; real profiles are ignored
scripts/      Runtime setup and diagnostic helpers
skills/       Reusable job-search Agent Skills
tasks/        Delivery contracts and validation evidence
```

Personal documents belong under `Jobs/`; generated artifacts belong under `outputs/`. Both are intentionally excluded from Git.

## Agent Skills

The `skills/` directory follows the open [Agent Skills](https://agentskills.io) format and supports Codex CLI, Claude Code, OpenClaw, Hermes, and Cursor with runtime-specific setup. See [docs/RUNTIMES.md](docs/RUNTIMES.md) for installation and invocation details.

## Current limitations

- New or changed jobs require a fresh evidence-based assessment; the server does not silently invent a score.
- Some employer pages block automated retrieval and require pasted job descriptions.
- USAJOBS needs user-supplied credentials; no secrets are bundled.
- Word layout and page count remain unverified when LibreOffice is unavailable.
- Voice and camera features require compatible hardware and browser permission.
- Scheduled searches, immutable application approval records, employer uploads, submissions, receipts, and duplicate-safe application tracking remain roadmap work. Approval is a required future safety gate; it does not make currently unimplemented submission behavior available.

## Documentation

- [PROJECT.md](PROJECT.md) — product behavior and implementation status
- [agenda.md](agenda.md) — product roadmap and architecture
- [AGENTS.md](AGENTS.md) — operating and safety rules
- [AGENTSKILL.md](AGENTSKILL.md) — incremental delivery protocol
- [SKILLS.md](SKILLS.md) — job-search stage procedures
- [gui/README.md](gui/README.md) — detailed dashboard and CV behavior
- [interview/README.md](interview/README.md) — detailed Interview Studio behavior

## Status

The project is suitable for local evaluation and assisted workflows. Treat recommendations and generated materials as drafts: verify source evidence, eligibility, formatting, and employer requirements before using them.

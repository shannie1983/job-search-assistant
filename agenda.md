# Personal Job Search Automation — Product and Delivery Agenda

**Owner:** Workspace user  
**Status:** Planning baseline; no recurring schedule or unattended external action is active  
**Last updated:** 2026-10-14  
**Primary interface:** Local web application at `http://127.0.0.1:8765`

## 1. Product outcome

Build a private, local-first job-search assistant that will, once configured, continuously discover relevant openings, recommend the strongest verified matches, create evidence-based resume variants, and prepare the user for interviews. The system should reduce repetitive work while keeping consequential decisions—especially applications, uploads, messages, and submissions—under explicit user control.

Success means the user can open one dashboard and answer four questions quickly:

1. Which newly verified jobs are worth considering?
2. Why does each job match or not match my real experience and preferences?
3. What resume and application package should I review for a selected job?
4. How should I prepare for the likely interview loop?

### Current baseline and next release gate

The workspace already has a local dashboard, one-time job discovery, fit scoring, star feedback, tracked/final DOCX tailoring, and Interview Studio components. These capabilities are prototypes with uneven source and rendering reliability; they do not constitute an active recurring service or blanket authorization to apply. The next release gate is one dependency-ordered, reproducible flow using a finalized profile and schema: verified posting → evidence-backed assessment → visually validated package → immutable review record. No external upload or submission is required to pass this gate.

### Default authorization matrix

| Action | Default | Authorization required |
| --- | --- | --- |
| Read public posting, rank, or create local draft | Allowed within the configured task | No additional approval |
| Save or upload data to an employer/third-party form | Blocked | Approval naming the job, destination, files/answers, and upload/save scope |
| Submit an application | Blocked | Separate confirmation unless the user explicitly grants one approval that clearly covers both upload and submission for the same immutable package |
| Email, recruiter message, or outreach | Blocked | Recipient- and content-specific authorization |
| Recurring search or notification | Inactive | Confirmed sources, cadence, timezone, thresholds, and channel |

New questions, changed attachments, changed answers, changed destinations, or other substantive content changes invalidate the applicable approval.

### Operational definitions

- **Verified/live posting:** An exact employer or authoritative ATS page is reachable and supports the role identity and open/application state at the recorded check time. Aggregator/index evidence alone is labeled `verification needed`.
- **Fresh:** The posting was rechecked within the configured freshness window; the initial default is 24 hours before package approval and again immediately before submission.
- **Substantive change:** Any change to claims, answers, attachments, destination, job identity, or action scope; removing review marks without changing approved content is not substantive.
- **Meaningful notification:** A newly qualified match, deadline within the configured window, material status change, failed run, or required user action—not an unchanged search result.
- **Successful submission:** Supported by a confirmation page, portal state, or receipt. Anything else is `submission outcome unknown`.
- **Source precedence:** Explicit user-confirmed facts override extracted materials; otherwise the selected master profile governs. Conflicts among sources remain unresolved and cannot support a new claim until the user confirms them.

## 2. Guiding principles

- **Evidence before automation:** Every resume claim must trace to the selected master profile, resume, or approved evidence.
- **Hard conditions first:** Work authorization, location, arrangement, required credentials, and other must-haves are checked before fit scoring.
- **Explainable recommendations:** Scores are ranking aids, not employer ATS scores or hiring probabilities. Each recommendation includes evidence, gaps, unknowns, and a reason.
- **Human approval at external-action gates:** Discovery, ranking, drafting, and local validation can run automatically. Uploading, saving an external form, submitting, emailing, or contacting a person requires job-specific approval.
- **Originals remain untouched:** Master documents and prior output versions are preserved. New resume variants are versioned separately.
- **Quiet automation:** Scheduled runs notify only for meaningful new matches, deadlines, failures, or needed user action.
- **Recoverable execution:** Unknown submission outcomes are investigated before retrying, and every material operation is logged.

## 3. Scope

### In scope

- Master profile and evidence management
- Job preference configuration
- Multi-source job discovery and posting verification
- Deduplication and prior-application checks
- Required-condition screening and explainable fit ranking
- User-interest feedback and personalized ordering
- Job-specific resume tailoring with change review
- Clean DOCX/PDF generation and visual/text validation
- Cover-letter and application-answer drafting when needed
- Company and role research with cited sources
- Interview plan, question bank, STAR-story preparation, voice/text practice, and feedback
- Application package approval, optional assisted submission, receipts, and status tracking
- Scheduled local runs and actionable notifications after configuration

### Out of scope for the initial release

- Unattended application submission without job-specific approval
- CAPTCHA bypass, access-control bypass, or fabricated answers
- Automatic recruiter outreach without recipient/content authorization
- Claims inferred from filenames, job descriptions, or unsupported assumptions
- Treating inaccessible or stale postings as verified openings
- Multi-user accounts, hosted SaaS operation, or public exposure of personal files

## 4. User journey

1. **Configure:** Select the master resume and evidence, target roles, required and preferred locations, work arrangement, compensation, exclusions, sources, and notification settings.
2. **Discover:** Run a one-time or scheduled search across preferred sources and official employer pages.
3. **Verify:** Confirm posting availability, capture source and check time, normalize fields, and remove duplicates.
4. **Screen:** Evaluate hard conditions; classify unsupported conditions as unknown or not met.
5. **Recommend:** Rank verified roles by experience fit, preference fit, evidence strength, and user-interest feedback.
6. **Review:** Open a job card containing the posting snapshot, match rationale, evidence map, gaps, deadline, and history.
7. **Tailor:** Generate a tracked resume proposal, keyword mapping, change rationale, and clean preview without inventing qualifications.
8. **Approve:** Review the exact job, attachment versions, answers, and intended external actions.
9. **Apply:** Optionally assist with upload and submission within the approved scope; pause for login, CAPTCHA, declarations, or new questions.
10. **Track:** Store receipt/evidence, status, next action, and follow-up timing without duplicate applications.
11. **Prepare:** Build an interview brief, company research, likely questions, evidence-linked STAR stories, and targeted practice drills.

## 5. Functional workstreams

### A. Profile and preferences

Deliverables:

- A structured master profile containing verified facts and source locations
- Required/preferred/unrestricted settings for roles, seniority, employment type, location, work arrangement, industries, employers, compensation, and exclusions
- Explicit work-authorization and declaration fields where applicable
- Master resume selection, language, page limit, and output-format settings
- Conflict and missing-information queue

Acceptance criteria:

- No fact is promoted to application-ready status without a source or explicit user confirmation.
- Conflicting dates, titles, and metrics remain visible until resolved.
- Missing hard conditions remain unknown; they are never treated as satisfied.

### B. Job discovery and verification

Deliverables:

- Pluggable source adapters for official employer sites, ATS boards, and configured aggregators
- A canonical job record with employer, title, location, arrangement, ID, requirements, deadline, URL, and checked-at timestamp
- Availability verifier, canonical URL logic, and source/ID deduplication
- Search run history with source successes, failures, and limitations

Acceptance criteria:

- Every displayed recommendation has a traceable source and check time.
- Known duplicates are consolidated. Previously submitted applications are blocked from reapplication but remain visible with the prior record and reason.
- Closed, inaccessible, or unverifiable roles are labeled accurately rather than silently accepted.

### C. Matching and recommendation

Deliverables:

- Required-condition gate before scoring
- Requirement-by-requirement evidence map: met, partially met, unknown, or not met
- Explainable fit score and recommendation: Apply, Apply if tailored, Verify, or Skip
- Separate experience-fit and location/preference treatment
- User star feedback used conservatively for personalized ordering

Acceptance criteria:

- Every score is reproducible from the stored posting, profile version, rubric, and evidence.
- Recommendations expose strengths, gaps, unknowns, deadline, source, and prior-application history.
- Updating the posting, profile, or master resume invalidates stale assessments.

### D. Resume and application package

Deliverables:

- Job-specific tracked DOCX with genuine Word insertions/deletions
- Change rationale and supported-keyword mapping
- Clean DOCX/PDF preview with no comments, highlights, deleted content, or revision marks
- Optional cover letter and application-answer draft
- Version hashes tying approval to exact materials

Acceptance criteria:

- Every added or reframed claim traces to approved evidence.
- Unsupported job requirements remain documented gaps.
- All rendered pages, links, fonts, line breaks, and extracted text are checked.
- Employer format/page constraints override local defaults.

### E. Approval, application, and tracking

Deliverables:

- Review screen showing job identity, source status, final files, answers, gaps, and requested action
- Approval record bound to job key, material hashes, answers, scope, time, and authorization evidence
- Separate upload and submit actions
- Receipt/success evidence and application-state history
- Recovery paths for login, CAPTCHA, timeouts, closed roles, and unknown outcomes

Acceptance criteria:

- No external save, upload, message, or submission occurs without matching approval.
- Substantive material changes invalidate approval.
- A submission is successful only when a success page, portal state, or receipt supports it.
- Unknown outcomes are not retried automatically.

### F. Interview preparation

Deliverables:

- Cited company and role brief
- Likely interview loop and 8–12 role-specific questions
- Evidence-linked STAR talking points and questions to ask the interviewer
- Text/voice mock interview with structured scoring and targeted drills
- Session archive and progress trends

Acceptance criteria:

- Company facts are cited or explicitly marked unverified.
- Suggested answers use only profile-backed experience.
- Feedback separates content, structure, relevance, specificity, and delivery.
- Each session ends with concrete next-practice actions.

### G. Scheduling, notifications, and operations

Deliverables:

- Configurable schedule, timezone, sources, and recommendation threshold
- Notifications for meaningful new matches, deadlines, failures, and required input
- Append-only run history and audit trail
- Health checks for source adapters, document rendering, and local services

Acceptance criteria:

- No schedule is activated until search settings and notification behavior are configured.
- Unchanged runs stay quiet.
- Every run records inputs, versions, results, failures, and next action.

### H. Security, privacy, and failure states

Deliverables:

- Localhost-only service binding by default, credential isolation, sensitive-log redaction, and least-privilege connector access
- User-configurable retention, backup, export, and deletion policies
- Explicit UI states for incomplete profile, no qualifying jobs, source outage, expired posting, unavailable renderer, invalidated approval, and unknown submission outcome
- MFA/login handoff that pauses for the user and never stores one-time codes in general logs

Acceptance criteria:

- Personal documents are not served publicly or copied outside approved destinations.
- Secrets and sensitive declarations are absent from ordinary run logs.
- Destructive deletion identifies exact paths and requires explicit authorization.
- Each failure state provides a recoverable next action and never misreports completion.

## 6. Proposed information architecture

The proposed mature dashboard uses seven primary areas; this information architecture remains provisional until the core end-to-end release gate passes:

1. **Settings & Connections** — profile, resume, API/source connections, permissions, and diagnostics
2. **Overview** — today’s new matches, pending decisions, deadlines, and pipeline summary
3. **Job Matches** — filters, ranked cards, evidence, gaps, stars, and availability status
4. **Tailor CV** — tracked proposals, keyword mapping, editor, clean exports, and validation
5. **Applications** — approval packages, submissions, receipts, statuses, and next actions
6. **Interview Studio** — preparation brief, company research, questions, practice, and reports
7. **Activity & Documents** — versioned artifacts, source snapshots, and audit history

The most important dashboard action is not “Apply”; it is “Review package.” Application remains a deliberate second step.

For the first dependable release, the minimum navigation is **Settings**, **Job Matches**, **Review Package**, and **Activity**. Tailoring and interview tools may remain linked subviews until the core path is stable.

## 7. Technical architecture

### Local components

- **Web UI:** Existing HTML/JavaScript dashboard and Interview Studio
- **Local API:** Existing Node.js services for search, ranking, tailoring, preferences, and sessions
- **Document services:** DOCX revision generation, PDF rendering, text extraction, and visual QA
- **Data store:** Versioned JSON/Markdown/files initially; migrate to SQLite only when transactional querying becomes necessary
- **Scheduler:** Local task/automation runner after settings are confirmed
- **Connectors:** Source-specific adapters with timeouts, rate limits, normalized errors, and credential isolation

### Core data entities

- `profile_version`
- `preference_version`
- `job_posting` and `posting_snapshot`
- `match_assessment`
- `document_artifact`
- `application_package`
- `approval_record`
- `application_event`
- `interview_plan` and `practice_session`
- `search_run` and `notification_event`

### State model

`discovered → verification needed / screened / excluded → materials draft → awaiting approval → approved → uploaded → submitted → receipt received / interview / rejected / offer / withdrawn`

Exception states include `posting closed`, `generation failed`, `upload failed`, and `submission outcome unknown`.

## 8. Delivery roadmap

### Phase 0 — Baseline and safety contracts

Goal: turn the current prototype into a measurable system with stable data contracts.

- Inventory implemented features and mark them as verified, partial, or planned.
- Define schemas for profile, jobs, match assessments, packages, approvals, and events.
- Add content hashes, version IDs, and invalidation rules.
- Consolidate audit logging and error taxonomy.
- Add fictional-data tests for fact traceability and approval boundaries.

Exit gate: one end-to-end local run is reproducible from stored inputs and produces an auditable result without external action.

### Phase 1 — Reliable discovery and recommendations

Goal: consistently produce a small set of live, relevant jobs.

- Complete source adapter health checks and fallback strategy.
- Improve employer-page verification and JavaScript-rendered ATS handling without bypassing access controls.
- Add stronger cross-source deduplication and previous-application detection.
- Formalize hard-condition gates and score explanations.
- Add saved searches and recommendation thresholds.

Exit gate: a run returns verified, deduplicated jobs with complete evidence-backed assessments, or clearly reports why none qualify.

### Phase 2 — Production-quality resume packages

Goal: generate review-ready materials for a selected job.

- Complete master profile extraction and conflict resolution.
- Harden evidence-safe resume rewriting and change provenance.
- Install/verify a DOCX/PDF rendering path and page-layout checks.
- Add clean export validation, link checking, and employer-format handling.
- Add optional cover letter and application-answer modules.

Exit gate: one selected job produces a tracked review file, clean DOCX/PDF, change report, keyword map, and validation report that pass automated and visual QA.

### Phase 3 — Approval and assisted application

Goal: safely support a real application after explicit review.

- Build immutable application-package review and approval records.
- Implement exact-file upload confirmation and separate submit confirmation.
- Capture portal outcomes and receipts.
- Add pause/resume for login, CAPTCHA, declarations, and unexpected questions.
- Prevent duplicate applications and unsafe retries.

Exit gate: one approved test application can be completed with a full audit trail; no action exceeds the recorded scope.

### Phase 4 — Interview preparation and learning loop

Goal: connect application evidence to focused interview practice.

- Link each submitted/selected role to its interview brief and question bank.
- Improve company research citations and freshness checks.
- Track rubric trends across sessions.
- Recommend drills based on recurring weak dimensions.
- Allow user corrections to feed profile facts and future preparation without silently changing application materials.

Exit gate: the user can prepare, practice, review a structured report, and see measurable improvement areas for a selected role.

### Phase 5 — Scheduling and operational readiness

Goal: run the workflow routinely with low maintenance.

- Configure search cadence, timezone, quiet hours, and notification channel.
- Add meaningful-change detection and digest mode.
- Add backups, retention controls, diagnostics, and recovery instructions.
- Measure source reliability, recommendation quality, package turnaround time, and user decisions.

Exit gate: scheduled discovery runs reliably, unchanged runs remain quiet, and failures surface with actionable recovery steps.

## 9. Prioritized implementation backlog

### P0 — Required for a trustworthy personal tool

- Finalize the master profile and resolve evidence conflicts.
- Define and validate canonical schemas and version hashes.
- Ensure every recommendation passes availability and hard-condition checks.
- Add robust invalidation when source/profile/resume content changes.
- Establish a working DOCX/PDF render-and-visual-QA pipeline.
- Implement immutable approval and audit records.
- Add duplicate-application and unknown-outcome protections.

### P1 — High-value usability

- Saved searches and clear empty-state explanations
- Side-by-side match evidence and resume-change review
- Deadline and next-action dashboard
- Cover-letter and application-answer generation
- Interview progress history and drill recommendations
- Notification digests and quiet hours

### P2 — Later enhancements

- Additional ATS adapters and source reliability scoring
- SQLite migration for richer history and analytics
- Calendar integration for interview events after authorization
- Email ingestion and status inference after mailbox authorization
- Compensation research and negotiation preparation
- Optional hosted/synced mode with a separate security design

## 10. Quality and safety test plan

Automated tests should use fictional identities and jobs and cover:

- Every generated claim has an allowed evidence source.
- Missing hard requirements never become “met.”
- Duplicate source IDs and canonical URLs collapse correctly.
- Closed or unverifiable postings cannot appear as verified recommendations.
- Profile, posting, or resume changes invalidate dependent assessments and approvals.
- Genuine DOCX revisions accept/reject correctly.
- Clean files contain no review marks and match the approved content.
- Rendered page counts and layouts meet configured constraints.
- Upload and submit remain distinct states.
- Unknown submission outcomes do not trigger automatic retries.
- Unapproved external actions are blocked.
- Unchanged scheduled runs do not send notifications.

Manual acceptance should include browser walkthroughs, all-page document inspection, keyboard/accessibility checks, and one controlled end-to-end application rehearsal.

## 11. Product metrics

Track metrics that improve the tool without pretending to predict hiring outcomes:

- Percentage of discovered jobs successfully verified
- Duplicate suppression accuracy
- Percentage of recommendations with complete evidence maps
- User acceptance rate by recommendation band
- False-positive reasons recorded by the user
- Time from job selection to validated package
- Number of unsupported claims blocked before export
- Approval invalidations caused by substantive changes
- Submission outcomes with usable evidence vs unknown outcomes
- Interview rubric trend by dimension
- Scheduled-run success and actionable-notification rate

## 12. Immediate next sprint

| Order | Work item | Dependency | Exit evidence |
| --- | --- | --- | --- |
| 1 | Reconcile implemented features against this agenda as complete, partial, or not started | None | Capability matrix with file/test evidence |
| 2 | Finalize the selected master profile and evidence inventory without reading unrelated personal files | User selects sources | Versioned profile plus conflict/unknown list |
| 3 | Stabilize job, profile, assessment, package, approval, and event schemas with content hashes | Items 1–2 | Schema validation and fictional-data tests |
| 4 | Repair and verify the DOCX/PDF render path | Item 1 | Known fixture rendered, extracted, and visually checked |
| 5 | Run one discovery and verification cycle | Item 3 | Source snapshots, deduplicated records, failures, and freshness timestamps |
| 6 | Select one verified high-fit role and create the full review package | Items 2–5 | Tracked DOCX, clean DOCX/PDF, mapping, rationale, and validation report |
| 7 | Create an immutable local review/approval record UI | Items 3 and 6 | Approval invalidation and scope tests; no submission required |
| 8 | Verify linked interview preparation for the same role | Item 6 | Cited brief, question set, STAR evidence links, and saved plan |
| 9 | Update run records and present the dashboard | All prior items | Valid `outputs/results.json`, updated `RUN_STATUS.md`, live local page |

## 13. Decisions required from the user

Before scheduled or application execution, confirm:

- Selected master resume and supporting evidence sources
- Target titles, seniority, industries, and excluded employers
- Required and preferred locations, remote eligibility, relocation, and commute limits
- Work authorization and any non-negotiable conditions
- Compensation floor and treatment of undisclosed compensation
- Search sources, cadence, timezone, quiet hours, and notification channel
- Resume language, maximum pages, and output formats
- Whether cover letters are generated by default or only when required
- Whether assisted upload is allowed, and whether submission always requires a separate confirmation
- Identity/contact fields and standard application answers that may be used, including declarations that must always pause for confirmation
- Which connectors, accounts, and credentials may be used; login/MFA handoff behavior
- Retention duration, backup location, export needs, and deletion preferences for personal and application data
- Posting freshness window and deadline/notification thresholds

Until these decisions are configured, the system may support one-time discovery and drafting but should not activate recurring execution or external application actions.

## 14. Definition of done

The product is ready for dependable personal use when it can repeatedly:

1. Find and verify current jobs from configured sources.
2. Enforce hard conditions and rank matches with traceable evidence.
3. Produce a fact-safe, visually validated application package.
4. Present the exact package and answers for explicit approval.
5. Assist with an authorized application while preserving receipts and uncertain states.
6. Generate cited, role-specific interview preparation and actionable practice feedback.
7. Run on schedule without noisy or unsafe behavior.
8. Preserve originals, versions, approvals, and a complete audit trail.

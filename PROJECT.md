# Job Search Assistant

Updated: 2026-10-12. Stage: requirements and workflow initialization. No working application has been verified.

## Goal and documentation

Discover jobs on a configured schedule, rank them by verified experience, prepare reviewable resumes, upload and submit after user approval, and track applications. Closest match means experience alignment; location preferences are evaluated separately. Documentation and generated reports use English. Application language follows employer requirements and user preference.

- [AGENTS.md](AGENTS.md): operating rules and permissions.
- [SKILLS.md](SKILLS.md): capability procedures and acceptance criteria.
- [PERMISSIONS_AND_WORKFLOW.md](PERMISSIONS_AND_WORKFLOW.md): detailed permissions.
- [RUN_STATUS.md](RUN_STATUS.md): actual execution progress.

Keep requirements consistent. Explicit user instructions take precedence.

## Existing materials and proposed layout

Jobs/ contains historical resumes, cover letters, and personal materials. Filenames do not prove accuracy, approval, or recency. Preserve originals. Do not publish personal materials or credentials.

Proposed application directories: config/ for preferences; data/profile/ for verified facts; data/jobs/ for sources and snapshots; outputs/<job-key>/<version>/ for reports and resumes; data/applications/ for approvals and receipts; data/events/ for append-only activity records. These directories do not imply implemented functionality.

## Preference options

Each filter supports required, preferred, or unrestricted. Missing information is not proof of compliance; execution settings remain unconfigured until provided.

| Group | Options |
| --- | --- |
| Roles | Titles, synonyms, keywords, discipline, seniority, full-time/part-time/contract |
| Industry/employer | Preferred industries, employer types, target employers, exclusions |
| Compensation | Minimum/maximum, currency, annual/hourly basis, undisclosed-pay handling |
| Location | Ranked countries/states/cities, excluded regions |
| Arrangement | Remote/hybrid/on-site, remote eligibility regions, relocation |
| Optional commute | Reference location, maximum distance/time; unknown data stays unknown |
| Search | Sources, frequency, time, timezone, recommendation count, notifications |
| Resume | Master file, supporting sources, language, page limit, DOCX/PDF requirements |

Initial timezone: America/Los_Angeles. A two-page draft is suggested pending user configuration. Employer limits take precedence. No schedule is active.

## Deliverables and acceptance

| Stage | Output | Acceptance |
| --- | --- | --- |
| Profile | Facts and source locations | Claims, dates, numbers trace to sources; conflicts identified |
| Discovery | Jobs and source timestamps | Verified links where possible; duplicates removed |
| Matching | Ranking, evidence, gaps, unknowns | Required conditions first; experience drives ranking |
| Tailoring | Tracked DOCX, change and keyword reports | Supported claims; revisions accept/reject in Word |
| Layout | Clean DOCX/PDF, validation | Rendered page limit met; readable; no review marks |
| Approval | Job, attachment versions, form answers | Explicit and traceable user approval |
| Submission | Upload/submission status, receipt | Within approval; unknown outcomes not called successful |
| Tracking | Status, next action | No duplicate applications; outreach separately authorized |

Map requirements to experience, source, and met/partially met/unknown/not met judgments. Scores are internal ranking aids, not employer ATS scores or hiring probabilities.

## States and approval

Discovered -> needs verification / screened / excluded -> materials draft -> awaiting approval -> approved -> uploaded -> submitted.

Exceptions: posting closed, generation failed, upload failed, submission outcome unknown. Later states: receipt received, interview, rejected, offer, user withdrawal.

Prepare clean previews before approval. Approval binds job, attachment versions/content hashes when implemented, form answers, and upload/submission scope. Substantive changes require renewed approval; removing review marks from identical approved content does not. Explicit batches may be approved. General job-search authorization does not permit unlimited submissions.

## Implementation order

The local GUI is implemented in gui/index.html and gui/server.cjs. Launch with `node gui/server.cjs` and open http://127.0.0.1:8765. It reads outputs/results.json and saves preferences to config/preferences.json. It currently displays initialization, not a completed job search. Search, resume generation, approval capture, and submission automation remain pending.

After each run, update the GUI results file and show the user the dashboard. Job entries support company, title, location, status, reason, gaps, url, and optional review text. Preserve run history. Browser refresh reloads the latest file. Do not expose personal documents through the server by default.

1. Confirm preferences, master resume, and facts.
2. Run one discovery, deduplication, and matching cycle.
3. Produce a single-job tracked resume, highlights, rendered files, and review package.
4. Implement approval, submission, receipts, and duplicate prevention.
5. Configure scheduling and meaningful-change notifications.

## Public design references

Reviewed 2026-10-12; not locally run or fully audited. No comparative reliability claim is made.

- [AGENTS.md examples](https://agents.md/): concise dedicated operating instructions.
- [Nanduu24/jobagent](https://github.com/Nanduu24/jobagent): fact verification, deduplication, staged processing. Our page limits are configurable and explicitly approved submissions are allowed.
- [pseudog0d/job-apply-agent](https://github.com/pseudog0d/job-apply-agent): screening, generation, and human review stages.

Only structural ideas were adopted; no installation scripts or submission policies were copied.

## Internet discovery update

Implemented POST /api/search with Remotive and credential-based USAJOBS retrieval, keyword filtering, source timestamps, deduplication, prior-state preservation, and failure records. The GUI includes Search internet now and direct saved-board links. Resume experience ranking and application actions remain pending.

## Match ratings implemented

Current jobs have assistant-authored semantic resume assessments with a 0–100 documented-fit score, criterion breakdown, paragraph-level evidence, gaps, and separate location notes. The GUI sorts by valid score. Resume or posting changes invalidate scores. New jobs remain awaiting assessment until reviewed; automatic inference is not implemented.

## Owner star feedback

Every job now shows its AI score beside a 1–5 star interest control. Stars are stored locally in config/ratings.json, with current ratings and change history. Clearing removes that rating from the active learning signal.

Personalized ranking adds a conservative adjustment derived from title-feature similarity to rated jobs. High ratings favor similar future titles, low ratings reduce preference, and three stars is neutral. More feedback increases influence gradually. AI qualification scores and eligibility remain unchanged. This is local preference learning, not model fine-tuning, and the workspace currently has a single owner rather than separate user accounts.

Sort modes: personalized recommendation, AI fit, owner stars. New jobs without AI assessments show no synthesized fit score. Six targeted tests pass for persistence, bounds, clearing, positive/negative feedback, unknown fit, and assessment invalidation.

## Self-reported experience and skills

Preferences now accepts optional total work experience (0–80 years, including half-year increments) and up to 100 skills entered by line or comma. Values persist as experience_years and skills in config/preferences.json and are labeled self-reported. Total tenure does not imply per-skill tenure, commercial duration, or qualification verification. Existing resume-based AI assessments are unchanged; future assistant reviews should compare these fields with resume evidence and flag conflicts.

## CV tailoring page

Tailor CV accepts a job URL and optional pasted job description, reads the selected clean DOCX master, proposes evidence-based summary/skill changes, and shows editable before/after paragraphs. Users can accept/reject proposals, add edits to other paragraphs, save/reopen drafts, and generate versioned downloads.

Exports include cv_tracked.docx with genuine Word insertion/deletion revisions and cv_final.docx containing accepted edits only. Source package parts and original master are preserved. Drafts and exports remain local under outputs/tailored/. Export validates the source hash; changed masters require a new draft. Public URL retrieval blocks private/local network addresses and uses timeout/size limits. Restricted pages need pasted descriptions.

The local drafting engine uses source-controlled templates and relevance rules, not an automatic LLM. It never imports unsupported requirements. User-edited text is explicitly user input and must be reviewed for accuracy. No upload/submission is performed.

Validation: genuine revisions, final text, acceptance/rejection behavior, source preservation, unchanged package parts, invalidated master, and Unicode extraction tested. The packaged renderer failed because soffice.exe is unavailable; page counts/layout are unverified and the GUI discloses this before downloads. Review the Word files before submission.

## Interview skill pipeline

The local Interview Studio applies the installed research-company, prep-interview, and mock-interview workflow to its existing voice practice. Preparation detects the role track and likely rounds, creates 8–12 CV-evidence-linked questions, adds a checklist and questions to ask back, and archives the loop plan. Practice retains local recording/transcription and now saves a structured 10-point session report. Company information remains source-bound; missing research is not synthesized as fact.

## JobClaw scoring and tailoring integration

Search-now prompts apply the installed find-jobs and score-fit workflow to every retained posting: hard conditions first, requirement evidence classified as met/partial/missing, a 45/20/15/15/5 fit rubric, and an Apply / Apply if tailored / Skip recommendation. Tailor CV preserves its evidence-only keyword insertion and adds a quality audit for quantified bullets, weak openers, first-person wording, and overly long bullets. Interview answer assessment reports both 100-point and 10-point ratings, identifies the weakest rubric dimension, and proposes targeted drills for the next attempt.

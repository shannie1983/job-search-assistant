# Local Job Search GUI

Start from the project root:

```powershell
node gui/server.cjs
```

Open http://127.0.0.1:8765. The server listens only on the local loopback interface.

The overview reads outputs/results.json. Update that file after each run, preserving run history, and click Refresh results to load changes. Job records support company, title, location, status, reason, gaps, url, and review text. Status values awaiting_approval and submitted drive the respective overview counts.

Preferences are saved to config/preferences.json. The GUI exposes only explicitly allowed project documents and candidate filenames, not resume contents. Internet discovery is now available. Scheduling, resume experience evaluation, approval capture, upload, and submission remain pending.


## Internet search

Use Search internet now for Remotive or USAJOBS. Remotive is an additional public remote-job source; listings are delayed by 24 hours and cached for six hours. It is not LinkedIn/Indeed data. Keyword ranking is not experience validation or proof of location eligibility.

USAJOBS requires USAJOBS_API_KEY and USAJOBS_EMAIL in the server environment followed by restart. Never put keys in project files. Direct search links open saved job boards but do not import listings.

Run checks with node --test gui/search.test.cjs.

## AI match ratings

All six currently collected postings have assistant-authored semantic assessments in outputs/ai_matches.json, based on the selected master resume and full stored descriptions. The GUI sorts valid scores highest first and shows weighted criteria, paragraph evidence, gaps, and eligibility notes.

Weights: technical requirements 40, role/domain experience 20, delivery/production 20, seniority/duration 10, communication 10. Scores are documented-fit estimates, not hiring probabilities. Missing evidence is not assumed satisfied. General alternate-role advertising is excluded from primary-role fit judgments.

Assessment validity binds the master file content and job title/description to SHA-256 hashes. Changed inputs invalidate ratings. New jobs await assistant assessment; the server does not run an automatic LLM inference service. Do not rerun record-assessments.cjs for changed inputs without reviewing and updating its judgments.

Checks: node --test gui/search.test.cjs gui/matches.test.cjs.

Star ratings are persisted locally in config/ratings.json. Personalized ranking uses conservative title-feature similarity; it does not retrain an LLM or modify AI fit scores. Controls support changing and clearing ratings. Single-owner workspace; separate user accounts are not implemented.

## Tailor CV workflow

Prepare CV changes is the user-triggered automatic workflow. Local drafting is the default: read the selected CV and posting, prepare evidence-based edits, export three DOCX variants with Python into outputs/tailored/<draft>/<revision>/, and load the review and downloads in the GUI. The Automatic CV workflow panel shows progress, edit/highlight counts, and the output path. Local drafting is rule-based, not an LLM.

The GUI checks saved backend drafts every 10 seconds while visible. New Codex-prepared outputs appear with an Open latest backend draft button, without replacing the current review. Codex AI editing requires an active Codex run; this integration does not automatically invoke a ChatGPT subscription from the browser. No recurring scheduler is enabled.

Open Tailor CV, paste a job link (and description when retrieval is blocked), and click Prepare CV changes. Review/edit each proposed paragraph; checked changes are included. Add paragraph edits as needed, save the draft, then Generate downloads for tracked and final DOCX copies.

Requires a clean DOCX master; PDF masters and masters with existing insert/delete revisions are not supported. Drafting uses local source-controlled templates, not an external model. Files are local/versioned; downloading does not approve an application. Page rendering is unavailable on this environment and explicitly labeled unverified.

Additional tests: node --test gui/tailor.test.cjs and the bundled Python runtime running gui/cv_document_test.py.

Tailor CV now accepts a directly attached DOCX (maximum 10 MB), saved locally under Jobs/Uploaded/ with a unique name. It becomes the source for the new draft only. Default master preferences and original files stay intact. PDF import remains unsupported for tracked editing. Reopen a previous tailoring draft opens saved edits; it is separate from CV attachment.

Tailor CV supports two source choices: select an existing DOCX from the project Jobs/ folders, or attach a new DOCX. Folder choices display relative paths and can be refreshed. Both apply to the draft being prepared and preserve default preferences.

Preferences offers the same master source choices: select a project-folder DOCX or upload one locally. Click Save preferences to set the default master; uploading alone does not apply the default. Refresh resume list preserves unsaved settings.

## OpenAI and Word review

Configure your own OpenAI API key in Tailor CV. It stays in server memory and is not saved to files or browser storage. Prepare uses the selected method; OpenAI mode sends CV paragraph text and the job description to https://api.openai.com/v1/responses. Local mode makes no model request. Model defaults to gpt-6-astra and can be changed. Real requests require your account key and model access; integration tests use mock responses.

Prepare automatically generates a highlighted tracked DOCX, unhighlighted tracked DOCX, and clean DOCX with accepted GUI edits. Open the review file in Word and use Review / Accept or Reject. For decisions made in Word, save and upload that file in the Word-reviewed section before removing highlights. This preserves Word changes rather than regenerating from the original draft. Page count/layout remain unverified on this host.

The Python document bridge explicitly reads UTF-8 stdin on Windows. The end-to-end export test includes en dashes and accented characters to prevent rejection of valid source paragraphs.

## In-page CV document editor
Tailor CV shows all source paragraphs in an editable document view with keyword highlights, original/proposed text, per-change Accept/Reject, Accept all/Reject all, and a clean preview. Decisions and edits use the same saved draft and Python DOCX export workflow. Browser text layout is an approximation: Word pagination, tables, and complex formatting are not reproduced. Original source document formatting is retained by the existing backend exporter where supported.

# Capability and Procedure Catalog

This is a workflow specification, not an installed or automatically discoverable skill package. Programmatic implementations remain pending. Follow AGENTS.md and PROJECT.md.

## Catalog

| Capability | Inputs | Outputs |
| --- | --- | --- |
| preferences | User targets and constraints | Settings, unknowns, version |
| profile-facts | Selected master and evidence | Traceable facts and conflicts |
| job-discovery | Search settings and sources | Deduplicated postings and snapshots |
| job-matching | Jobs, facts, preferences | Ranking, evidence, gaps |
| resume-tailoring | Selected job and facts | Change plan and tracked DOCX |
| resume-review | Resume and requirements | Highlights, clean files, validation |
| application-review | Job, attachments, answers | Review package and approval |
| application-submit | Valid approval and URL | Outcome, receipt, recovery state |
| application-tracking | Records and authorized sources | Status, next action, notification |

## preferences

Collect required/preferred/unrestricted settings. Unanswered conditions remain unknown. Show a summary. List candidate filenames without choosing a master based on its name.

Completion: targets, location preferences, and sources are explicit. Scheduling additionally needs frequency, time, timezone. An authorized one-time search needs no schedule.

## profile-facts

Read designated materials. Record fact_id, content, source file, paragraph/page location, confirmation status. Separate skills, projects, employment dates, numerical achievements, education. Identify conflicts rather than guessing.

Completion: application claims have sources; consolidate questions. Work authorization, salary expectations, and declarations require explicit information.

## job-discovery

Search titles/synonyms. Capture employer, title, location, arrangement, ID, requirements, deadline, URL, check time. Preserve original deadline wording; do not infer missing dates. Prefer official pages; distinguish closed from unverified.

Deduplicate by source/ID, otherwise canonical URL. Check cross-source duplicates by employer, role, location rather than title alone.

Completion: traceable sources, no known duplicate applications; unchanged scheduled runs remain quiet.

## job-matching

Check required conditions before experience and preferred settings. Report employer, role, ID, source URL, check time, location/arrangement, priority/consider/verify/exclude recommendation, reasons, role/location preferences met, gaps, base resume, proposed edits, deadline, application history.

| Requirement | Experience evidence | Source location | Judgment |
| --- | --- | --- | --- |
| Example requirement | Supported fact | File and paragraph/page | met / partially met / unknown / not met |

Completion: explainable ranking; unknowns are not satisfied. Scores are not ATS verdicts or hiring probabilities.

## resume-tailoring

Select supported experience; adjust summary, ordering, wording, length. Record each edit's job rationale and fact source. Preserve original differences with genuine Word insertions/deletions.

Outputs: resume_review.docx, changes.md, keyword_mapping.md in stable job/version directories; preserve older versions.

Completion: claims supported and revisions accept/reject in Word. Explicitly report inability to create real revisions.

## resume-review

Classify posting keywords as supported existing content, supported wording changes, or unsupported gaps. Highlight for review only; record unsupported qualifications as gaps.

Render review/clean files. Check fonts, line breaks, pagination, tables, links, extracted text. Apply page limit to submission version. PDF/DOCX content must agree; metadata alone does not establish rendered pages.

Outputs: resume_clean.docx, resume_clean.pdf, validation.md. Report limit, measured pages, keyword/fact checks, unverified items. Follow required attachment formats.

## application-review

Prepare posting source/status, final previews, changes, matching report, completed answers. Identify missing user answers; do not guess declarations.

Approval fields: job_key, attachment versions/content hashes, answer version, upload/submission scope, time, authorization evidence. Automated hashing/records remain implementation requirements.

Completion: complete concrete application is available for review before approval.

## application-submit

Verify approval matches job, files, answers. Use verified URL; fill/upload/submit within scope. New questions use explicit known facts or remain pending.

Completion: record upload and submission separately. Unknown results remain submission_outcome_unknown; inspect status/receipt before retry. Preserve progress for user login/CAPTCHA.

## application-tracking

Record state changes, versions, approvals, evidence, next action by job key. Mailbox access/outreach needs authorization; local follow-up drafts may be prepared within task scope.

Completion: notify for new matches, actionable deadlines, completion/failure, or needed user action. Configure thresholds/channels.

## Future skill packaging

If requested, package capabilities in individual directories with SKILL.md and support files, then validate for the target tool. This catalog installs no global skills or dependencies.

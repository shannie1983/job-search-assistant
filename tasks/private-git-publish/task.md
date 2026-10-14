# Private Git Repository Publication

Status: in_progress  
Owner: agent/user  
Agenda link: repository delivery and operational readiness

## Outcome

Package the reusable application source and documentation in a local Git repository, exclude personal and generated job-search data, commit the sanitized tree, create a private GitHub repository, and push only after a final privacy check.

## Scope

- Add privacy-focused ignore rules and sanitized configuration examples.
- Initialize Git with `main` as the default branch.
- Scan staged filenames and text for likely secrets or personal artifacts.
- Create one local initial commit.
- Create and push to a private GitHub repository when authenticated tooling is available.

## Non-goals

- No public repository.
- No upload of resumes, recordings, generated applications, real preferences, run history, credentials, or private profiles.
- No installation of GitHub tooling without explicit authorization.

## Inputs and dependencies

- Git is installed.
- GitHub CLI is not installed; browser creation or later CLI installation is required for the remote step.
- Existing project files remain in place; `.gitignore` controls publication scope.

## Skill routing

- No domain skill applies. Follow `AGENTS.md` and `AGENTSKILL.md` for task records, validation, approval, and recovery.

## Design and data contract

- Repository visibility must be private.
- The staged tree is the publication contract.
- Ignored personal files remain local and are never force-added.
- A remote push is allowed only after filename and content scans pass.

## Settings and folders

- Repository name: `job-search-assistant`.
- Default branch: `main`.
- Sanitized examples live under `config/` and `profile/`.

## GUI behavior

- No product GUI changes.
- The existing local GUI remains available for validation.

## Implementation steps

1. Create `.gitignore` and sanitized examples.
2. Initialize Git and stage the distributable tree.
3. Audit staged files and scan for likely secrets/personal artifacts.
4. Commit locally.
5. Create a private GitHub repository and push after the required external-action confirmation.

## Automated acceptance

- No ignored personal directory or binary resume/recording is staged.
- No obvious API key, private key, password assignment, or bearer token is found in staged text.
- Git repository uses branch `main` and has a clean committed distributable tree.
- Remote visibility is private before the first push.

## Human validation

- Review the staged filename list before commit.
- Review the created GitHub repository visibility and top-level contents after push.

## Approval gates

- Local initialization and commit are authorized by the user's request.
- Creating the GitHub repository and pushing files are external cloud actions and must use the requested private visibility.

## Recovery and rollback

- Personal files remain outside Git history.
- If a secret is found after staging but before push, unstage it and strengthen `.gitignore`.
- If a secret reaches a remote, stop, rotate the secret, remove it from history, and force-push only with explicit authorization.

## Evidence and result

- Privacy rules and examples created.
- GitHub CLI 2.102.0 installed and authenticated as `shannie1983`.
- Staged publication tree contains 152 files; forbidden personal/generated path scan passed.
- Staged diff secret-pattern scan passed.
- Automated validation passed: 57 Node tests and 2 Python document tests.
- Local commit, private remote creation, and push remain pending.

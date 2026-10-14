# Project AGENTS.md

## Project Overview

- Project name: `<project-name>`
- Purpose: `<one or two sentences explaining what this project does>`
- Primary users: `<target users>`
- Current status: `<prototype | active development | production | maintenance>`
- Main documentation: `<README.md or docs path>`

## Scope

Codex may:

- Modify files required for the requested task.
- Add or update tests related to changed behavior.
- Update documentation when behavior or usage changes.
- Run the project’s approved development and validation commands.

Codex must not:

- Change unrelated files or behavior.
- Replace the established architecture without explicit approval.
- Introduce new production dependencies without explaining the reason.
- Modify deployment, infrastructure, authentication, billing, or secrets without explicit approval.
- Publish, deploy, merge, or create releases unless explicitly requested.

## Repository Structure

- `<src/>`: Application source code.
- `<tests/>`: Automated tests.
- `<docs/>`: Project documentation.
- `<scripts/>`: Development and maintenance scripts.
- `<config/>`: Non-secret configuration.
- `<public/>`: Static assets.
- `<data/>`: Local project data; do not overwrite without approval.

Update this section to reflect the actual repository.

## Technology Stack

- Language: `<Python | TypeScript | Java | other>`
- Runtime: `<version>`
- Framework: `<framework and version>`
- Package manager: `<npm | pnpm | uv | pip | poetry | other>`
- Database: `<database or none>`
- Testing framework: `<pytest | Vitest | Jest | other>`
- Formatting and linting: `<Ruff | ESLint | Prettier | other>`

Use the versions already defined by the project. Do not upgrade major versions unless requested.

## Setup

Install dependencies with:

```shell
<installation command>

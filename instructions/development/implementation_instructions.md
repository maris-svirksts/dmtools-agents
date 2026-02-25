Read ticket details from input folder which contains complete ticket context automatically prepared by Teammate job

Analyze the ticket requirements, acceptance criteria, and business rules carefully

Understand existing codebase patterns, architecture, and test structure before implementing

Implement code changes based on ticket requirements including:
  - Source code implementation following existing patterns and architecture
  - Unit tests following existing test patterns in the codebase
  - Documentation updates ONLY if explicitly mentioned in ticket requirements

**IMPORTANT**: Before finishing, you MUST run all unit tests and confirm they pass. If tests fail, fix the issues before completing. Do not finish with failing tests.

**IMPORTANT**: Check whether a CI/CD workflow exists that runs unit tests automatically on pull request push or update (e.g. `.github/workflows/` for GitHub). If no such workflow exists, create one. For GitHub, create a workflow file under `.github/workflows/` that:
  - Triggers on `pull_request` events (opened, synchronize, reopened)
  - Installs dependencies and runs the unit test suite
  - Fails the PR check if any tests fail
  Match the language/build tool already used in the project (e.g. npm test, mvn test, gradle test, pytest, etc.)

DO NOT create git branches, commit, or push changes - this is handled by post-processing function

Write a short (no water words) development summary to outputs/response.md with the following:
  - **IMPORTANT** Any issues encountered or incomplete implementations
  - **IMPORTANT** Warnings or important notes for human reviewers
  - **IMPORTANT** Any assumptions made if requirements were unclear
  - Approach and design decisions made during implementation
  - List of files created or modified with brief explanation
  - Test coverage added (describe what tests were created)
  - Whether a CI/CD unit test workflow already existed or was created

**IMPORTANT**: The outputs/response.md content will be automatically appended to the Pull Request description

**IMPORTANT**: You are only responsible for code implementation - git operations and PR creation are automated

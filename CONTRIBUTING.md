# Contributing Guidelines

Welcome to PlaceTrack AI! We are excited to have you contribute to this project. Please read these guidelines carefully before starting to ensure a smooth contribution process.

## 1. Getting Assigned
- **How to claim an issue**: Browse open issues, choose one you are interested in, and leave a comment stating you'd like to work on it.
- **Wait for Assignment**: Please wait until a project maintainer officially assigns the issue to you before you start working on it. PRs submitted for issues without prior assignment may not be accepted.
- **7-day Inactivity Window**: Once assigned, you have 7 days to submit a Pull Request. If there is no activity (either a PR or a progress update comment) within 7 days, the issue will be unassigned and made available to other contributors.

## 2. Difficulty & XP Labels
Issues are categorized by difficulty and award different Experience Points (XP) upon successful merge:
- **Newbie**: 10 XP (Simple changes, documentation, quick fixes)
- **Adventurer**: 25 XP (Intermediate features, bug fixes, refactoring)
- **Veteran**: 50 XP (Complex features, architectural changes, comprehensive test coverage)

## 3. Branch Naming Discipline
All work must be done on a separate branch created from the latest `main`. Branch names must follow this format:
- `feat/*` — for new features (e.g., `feat/auth-refresh`)
- `fix/*` — for bug fixes (e.g., `fix/readiness-score-calc`)
- `docs/*` — for documentation updates (e.g., `docs/contributing-md`)
- `refactor/*` — for code refactoring (e.g., `refactor/api-endpoints`)
- `security/*` — for security patches (e.g., `security/jwt-rotation`)
- `ci/*` — for CI/CD updates (e.g., `ci/github-actions`)

*Never commit to the `main` branch directly.*

## 4. Pull Request Title Format
Your PR titles must follow this format to align with ELUSoC'26 guidelines:
- `[ELUSoC'26] brief description` (e.g., `[ELUSoC'26] add contributing guidelines`)

## 5. Pull Request Description
Your PR description must include:
- **Linked Issue**: A line stating `Fixes #X` or `Closes #X` to automatically close the associated issue.
- **Summary**: A detailed explanation of what changes were made and why.
- **Screenshots/Recordings**: Required for any visual/UI changes (before/after).
- **Testing**: A summary of testing performed to verify the changes.

## 6. Pull Request Checklist
Before submitting your PR, verify the following checklist:
- [ ] I have been officially assigned to the issue.
- [ ] My branch name is correct and follows the branch naming guidelines.
- [ ] I have run `npm run build` locally and it builds successfully without errors.
- [ ] No `.env` files, secrets, or temporary configuration files are staged or committed.

## 7. Local Setup
Please refer to the [README.md](README.md#getting-started) for the local development environment setup instructions.

## 8. What Not to Do
- **No PRs without assignment**: Do not submit PRs for issues you are not assigned to.
- **No spam**: Do not submit low-quality, AI-generated spam, or duplicated contributions.
- **No unrelated changes**: Keep your branch and PR focused on the assigned issue. Do not bundle multiple unrelated issues or changes into a single PR.

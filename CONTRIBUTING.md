# Contributing to BuildFlow

Thanks for your interest in contributing.

## Development Setup

1. Clone the repo.
2. Open the repository in VS Code.
3. Install dependencies:
   - `cd buildflow`
   - `npm install`
4. Start extension debug session from repo root with `F5`.

## Project Structure

- Extension source: `buildflow/src`
- Extension manifest: `buildflow/package.json`
- Extension docs/changelog: `buildflow/README.md`, `buildflow/CHANGELOG.md`

## Before Submitting a PR

From `buildflow/` run:

- `npm run lint`
- `npm run compile`

Update docs/changelog when behavior or user-facing features change.

## Pull Request Guidelines

- Keep PRs focused and small when possible.
- Include a clear summary of user-visible changes.
- Link related issues if applicable.
- Add screenshots/GIFs for UI changes when possible.

## Reporting Issues

Use GitHub Issues and include:

- steps to reproduce
- expected vs actual behavior
- VS Code version
- extension version
- OS details

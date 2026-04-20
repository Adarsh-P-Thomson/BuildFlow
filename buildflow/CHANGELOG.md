# Changelog

All notable changes to this project are documented in this file.

## [0.1.0] - 2026-04-20

### Added

- BuildFlow sidebar tree view with hierarchical model:
  - Project -> Category -> Task -> Gameplan Step
- Local workspace storage at `.vscode/buildflow.json`
- Inline actions across all levels:
  - add, edit, delete
- View title actions:
  - add project
  - refresh
- Full command set for create/edit/delete operations
- Task and gameplan step checkbox support in tree view

### Changed

- Moved toward checkbox-first interaction instead of command-heavy workflow
- Improved task label clarity with progress indicators

### Fixed

- Improved default debug launch behavior when opening parent workspace
- Updated ignore rules to keep important workspace configs trackable

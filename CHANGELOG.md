# Changelog

All notable changes to this project are documented in this file.

## [0.1.2] - 2026-04-21

### Added

- Task-level file attachment with TODO/FIXME parsing into gameplan steps
- Step-level file attachment (without TODO/FIXME parsing)
- Open attached file actions for tasks and steps
- Detach attached file actions for tasks and steps

### Changed

- Attachment picker now uses workspace files and prioritizes the currently open file
- Task/step rows now display attached file context (name/tooltip)
- Inline attachment action is now stateful:
  - unattached: attach file
  - attached: open + detach file

## [0.1.1] - 2026-04-21

### Added

- Step-level inline edit action (`BuildFlow: Edit Gameplan Step`)
- Extension branding assets and metadata for Marketplace packaging:
  - icon
  - publisher/repository/homepage/bugs fields
  - refined keywords and description

### Changed

- Sharpened README positioning and value proposition for Marketplace/GitHub
- Updated root repository docs layout for publish readiness
- Simplified step-level inline actions to reduce confusion:
  - kept edit/delete
  - removed `+` action from step row

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

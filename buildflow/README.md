# BuildFlow

Plan features without leaving your codebase.

BuildFlow is a local-first VS Code extension for structured project planning inside your repo.

Instead of scattered TODO comments, sticky notes, or switching to external tools, BuildFlow keeps your plan where you write code.

## Why BuildFlow

Most developers already try one of these:

- TODO comments in code
- markdown checklists
- Notion/Trello boards away from the editor

BuildFlow gives you a better default:

- Structured planning: `Project -> Category -> Task -> Step`
- Fast inline controls: `+`, edit, delete on each row
- Checkbox-first progress tracking for tasks and steps
- File attachments on tasks/steps with quick open/detach actions
- Git-friendly local data in `.vscode/buildflow.json`

## Structure

- Project
- Category
- Task
- Gameplan Step

All data is stored locally in your workspace.

## Features

- Sidebar tree for projects, categories, tasks, and steps
- Checkbox-first workflow for tasks and gameplan steps
- Inline row actions at every level: `+`, edit, delete
- Quick toolbar actions: `+` (new project), refresh
- Local JSON storage (no external account required)
- Task file attachment can parse `TODO` / `FIXME` into gameplan steps
- Step file attachment is supported without parsing

### Checkbox behavior

- Checking a step marks it complete and updates task status automatically
- Checking a task marks all steps complete and sets task to `DONE`
- Unchecking a task clears all steps and sets task to `TODO`

### File attachment behavior

- Attach files from workspace picker (current open file is prioritized)
- Clicking a task/step row with an attached file opens that file
- Task attachment can auto-generate steps from `TODO` / `FIXME`
- Step attachment is manual only (no parsing)

## Quick Start

1. Open a folder/workspace in VS Code.
2. Open the **BuildFlow** view in Explorer.
3. Click the `+` in the view title to create your first project.
4. Use inline actions on each row:
   - `+` to add the next level
   - edit icon to rename/edit
   - trash icon to delete

## Commands

You can still use Command Palette for all actions:

- `BuildFlow: Create Project`
- `BuildFlow: Rename Project`
- `BuildFlow: Delete Project`
- `BuildFlow: Add Category`
- `BuildFlow: Rename Category`
- `BuildFlow: Remove Category`
- `BuildFlow: Add Task`
- `BuildFlow: Edit Task`
- `BuildFlow: Delete Task`
- `BuildFlow: Attach File To Task`
- `BuildFlow: Open Task Attached File`
- `BuildFlow: Detach File From Task`
- `BuildFlow: Add Gameplan Step`
- `BuildFlow: Edit Gameplan Step`
- `BuildFlow: Remove Gameplan Step`
- `BuildFlow: Attach File To Step`
- `BuildFlow: Open Step Attached File`
- `BuildFlow: Detach File From Step`
- `BuildFlow: Toggle Task Status`
- `BuildFlow: Toggle Step Complete`
- `BuildFlow: Refresh`

## Data Format

BuildFlow stores data in `.vscode/buildflow.json`:

```json
{
  "version": 1,
  "projects": []
}
```

## Notes

- BuildFlow cannot set itself to the Secondary Sidebar by default. Users can move the view once and VS Code remembers the layout.

## License

MIT

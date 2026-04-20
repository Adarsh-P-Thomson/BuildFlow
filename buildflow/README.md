# BuildFlow

BuildFlow is a lightweight project planner for developers who want to manage work directly inside VS Code.

It keeps planning close to code with a simple hierarchy:

- Project
- Category
- Task
- Gameplan Step

All data is stored locally in your workspace at `.vscode/buildflow.json`.

## Features

- Sidebar tree for projects, categories, tasks, and steps
- Checkbox-first workflow for tasks and gameplan steps
- Inline row actions at every level: `+`, edit, delete
- Quick toolbar actions: `+` (new project), refresh
- Local JSON storage (no external account required)

### Checkbox behavior

- Checking a step marks it complete and updates task status automatically
- Checking a task marks all steps complete and sets task to `DONE`
- Unchecking a task clears all steps and sets task to `TODO`

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
- `BuildFlow: Add Gameplan Step`
- `BuildFlow: Edit Gameplan Step`
- `BuildFlow: Remove Gameplan Step`
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

# BuildFlow Repository

BuildFlow helps developers stay on track without leaving VS Code.
Create projects, organize by categories, break work into tasks, and complete gameplan steps with checkbox-first workflow.
Everything is stored locally in .vscode/buildflow.json

## Extension Project

- Path: `buildflow/`
- Marketplace package root: `buildflow/`
- Main extension metadata: `buildflow/package.json`

## Quick Start (Local Dev)

1. Open this repository in VS Code.
2. Run `F5` using the root debug profile (`Run BuildFlow Extension`).
3. In the Extension Development Host, open any workspace folder and use the BuildFlow view.

## Publish

Extension publishing should be run from `buildflow/`:

```powershell
cd buildflow
npx @vscode/vsce package
# npx @vscode/vsce publish
```

## License

MIT

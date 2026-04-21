# BuildFlow

BuildFlow is a VS Code extension for structured, local-first project planning inside your code workspace.

Main extension source lives in `buildflow/`.

## Repository Layout

- Extension package root: `buildflow/`
- Extension manifest: `buildflow/package.json`
- Extension README (Marketplace-facing): `buildflow/README.md`

## Quick Start (Local Dev)

1. Open this repository in VS Code.
2. Press `F5` and run `Run BuildFlow Extension`.
3. In the Extension Development Host window, open any workspace folder and use BuildFlow in Explorer.

## Publish Notes

Run publish/package commands from `buildflow/`:

```powershell
cd buildflow
npx @vscode/vsce package
# npx @vscode/vsce publish
```

## Open Source

- Contributing guide: [CONTRIBUTING.md](CONTRIBUTING.md)
- Code of conduct: [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)
- Security policy: [SECURITY.md](SECURITY.md)

## License

MIT

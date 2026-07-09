# Project Tools

This folder is the project-local entry point for tools that are installed on the
machine but should not be copied into the repository.

Do not vendor large executables such as Git, Node.js, Python, Chrome, or database
clients into this project. Keep this folder for small scripts, path helpers, and
tooling notes that make the local environment easier to reuse.

## Categories

### Version Control

Primary Git install:

```powershell
C:\Users\User\AppData\Local\Programs\Git\cmd\git.exe
```

Fallback Git bundled with GitHub Desktop:

```powershell
C:\Users\User\AppData\Local\GitHubDesktop\app-3.6.2\resources\app\git\cmd\git.exe
```

Use:

```powershell
.\tools\use-local-tools.ps1
git status --short
```

### JavaScript Runtime

Used only when the project needs local syntax checks or simple scripts. This
project is plain HTML/CSS/JavaScript and should not require a build step unless
that is explicitly requested.

Installed Node.js path:

```powershell
C:\Users\User\AppData\Local\Programs\node-v24.18.0-win-x64
```

Expected commands:

```powershell
node --version
npm --version
```

### GitHub CLI

Installed GitHub CLI path:

```powershell
C:\Users\User\AppData\Local\Programs\GitHub CLI\bin\gh.exe
```

Use `gh auth login` only when GitHub CLI authentication is needed. Normal commit
and push can use Git without `gh`.

### Browser Checks

Use the Codex in-app browser or Chrome for visual checks, responsive layout, and
console errors. Browser binaries should stay installed outside this repository.

### Supabase

Supabase SQL is managed manually through Supabase SQL Editor. Keep project SQL in:

```text
supabase/schema.sql
supabase/README.md
```

Do not put secret keys in the frontend. Publishable keys are allowed only for the
current public RPC use case.

### Project Scripts

Existing project scripts belong in:

```text
scripts/
```

Local environment helpers belong in:

```text
tools/
```

## Quick Check

Run this from the project root:

```powershell
.\tools\use-local-tools.cmd
.\tools\check-tools.cmd
```

The `.cmd` wrappers are provided because some Windows environments block direct
`.ps1` execution by default.

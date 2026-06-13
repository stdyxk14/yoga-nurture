# Development Notes

## Windows / PowerShell and Japanese Text

Japanese UI labels can look garbled in PowerShell when the console is not using UTF-8. The app files should remain UTF-8, and browser DOM checks should be treated as the source of truth.

Recommended PowerShell setup before inspecting Japanese logs:

```powershell
chcp 65001
$OutputEncoding = [System.Text.UTF8Encoding]::new()
$env:PYTHONIOENCODING = "utf-8"
$env:NODE_OPTIONS = "--enable-source-maps"
```

When a command still renders Japanese as `????` or mojibake, prefer one of these approaches:

- Use Playwright assertions against DOM text instead of matching Japanese from shell output.
- Use CSS selectors such as `button[type="submit"]` or stable roles when the shell cannot safely pass Japanese button names.
- Run short Node.js scripts from UTF-8 files instead of inline PowerShell strings for Japanese-heavy checks.
- If a command only fails because the terminal cannot display Japanese, confirm in the browser before changing application code.

On this Windows environment, use `npm.cmd` if PowerShell blocks `npm.ps1`:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e:smoke
```

## E2E Environment Variables

Playwright smoke tests can run in two modes.

Without credentials:

- `/login` renders
- protected pages redirect to `/login`

With credentials:

- `/login` accepts the test account
- `/dashboard`, `/students`, `/lessons`, `/reports`, and `/settings` render
- logout from `/settings` works

Authenticated tests require all three values:

```text
E2E_BASE_URL=https://yoga-nurture.vercel.app
E2E_TEST_EMAIL=
E2E_TEST_PASSWORD=
```

If any value is missing, the authenticated test group is skipped and Playwright prints the missing variable names.

Never commit real passwords or test account email addresses. Keep real values in a local `.env.e2e.local` file, local `.env.local` file, shell environment, or CI secrets. Playwright loads `.env.e2e.local` before `.env.local`; both files are ignored by Git through the `.env*` rule.

PowerShell example:

```powershell
$env:E2E_BASE_URL = "https://yoga-nurture.vercel.app"
$env:E2E_TEST_EMAIL = "<test email>"
$env:E2E_TEST_PASSWORD = "<test password>"
npm.cmd run test:e2e:smoke
```

## AI Mentor Environment Variables

AI mentor calls must run on the server only. Use this variable name in local `.env.local` files and Vercel Environment Variables:

```text
OPENAI_API_KEY=
```

Do not use `NEXT_PUBLIC_` for OpenAI keys. If `OPENAI_API_KEY` is missing, the app should show `AI連携は未設定です` and continue working without crashing.

AI suggestion history is stored in Supabase table `ai_suggestions`. If the table has not been created yet, run:

```text
supabase/migrations/002_ai_suggestions.sql
```

## Codex Verification Flow

Normal code changes:

```bash
npm run lint
npm run build
```

UI, routing, or auth changes:

```bash
npm run lint
npm run build
npm run test:e2e:smoke
```

DB-connected changes against production:

```powershell
$env:E2E_BASE_URL = "https://yoga-nurture.vercel.app"
$env:E2E_TEST_EMAIL = "<test email>"
$env:E2E_TEST_PASSWORD = "<test password>"
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e:smoke
```

## Deployment Rule

Do not use `vercel deploy --prod` for this project. The expected flow is:

1. Commit locally.
2. Push to GitHub `main`.
3. Let the Vercel `yoga-nurture` project deploy automatically from Git integration.
4. Confirm production at `https://yoga-nurture.vercel.app`.

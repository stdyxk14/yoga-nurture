# YOGA NURTURE

Yoga instructor management app built with Next.js, TypeScript, Tailwind CSS, shadcn/ui, Supabase, and OpenAI server-side AI helpers.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Required Local Environment

Create a local `.env.local` file when running the app locally. Do not commit real secrets.

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
OPENAI_API_KEY=
```

`OPENAI_API_KEY` is server-side only. Never expose it with a `NEXT_PUBLIC_` prefix.

## E2E Smoke Tests

The smoke test can run in two modes.

Without credentials, it checks:

- `/login`
- unauthenticated redirects from protected pages

With credentials, it also checks:

- login from `/login`
- `/dashboard`
- `/students`
- `/lessons`
- `/reports`
- `/settings`
- logout from `/settings`

Set these values only in your local shell or local `.env.local`. Never commit real email addresses or passwords.

```text
E2E_BASE_URL=https://yoga-nurture.vercel.app
E2E_TEST_EMAIL=
E2E_TEST_PASSWORD=
```

PowerShell example:

```powershell
$env:E2E_BASE_URL = "https://yoga-nurture.vercel.app"
$env:E2E_TEST_EMAIL = "<test email>"
$env:E2E_TEST_PASSWORD = "<test password>"
npm.cmd run test:e2e:smoke
```

Alternatively, put those three values in `.env.local`; Playwright loads local env files through `@next/env`.

If any of the three E2E variables is missing, authenticated tests are skipped with a message listing the missing variables.

## Project Checks

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

On Windows PowerShell, use `npm.cmd` if `npm.ps1` is blocked by execution policy:

```powershell
npm.cmd run lint
npm.cmd run build
npm.cmd run test:e2e:smoke
```

See [docs/development-notes.md](./docs/development-notes.md) for Windows UTF-8 notes and Codex verification guidance.

## Deployment Rule

Do not use Vercel CLI manual deploys for this project.

Expected deployment flow:

1. Commit locally.
2. Push to GitHub `main`.
3. Let the Vercel `yoga-nurture` project deploy automatically from Git integration.
4. Confirm production at [https://yoga-nurture.vercel.app](https://yoga-nurture.vercel.app).

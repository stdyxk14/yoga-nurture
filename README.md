This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Project Checks

通常の変更後:

```bash
npm run lint
npm run build
```

UIや導線を変更した後:

```bash
npm run test:e2e:smoke
```

Playwright の認証付き確認を行う場合は、実値をコードに書かずに環境変数で渡してください。

```text
E2E_BASE_URL=https://yoga-nurture.vercel.app
E2E_TEST_EMAIL=<test email>
E2E_TEST_PASSWORD=<test password>
```

Windows / PowerShell の日本語表示や Codex 作業時の確認手順は [docs/development-notes.md](./docs/development-notes.md) を参照してください。

Vercel は CLI 手動デプロイではなく、GitHub `main` push から `yoga-nurture` プロジェクトの自動デプロイを使います。

# Integrations setup

The Delegation now has a local tools backend for GitHub, Vercel, Browser, Terminal and human approvals.

## 1. Install

```bash
npm install
```

## 2. Configure environment

Copy `.env.example` to `.env` and set:

- `DELEGATION_ENCRYPTION_KEY` to a long random secret.
- `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`.
- `VERCEL_CLIENT_ID` / `VERCEL_CLIENT_SECRET`.

For local development the callbacks are:

- GitHub: `http://localhost:8787/api/github/callback`
- Vercel: `http://localhost:8787/api/vercel/callback`

Do not commit `.env` or `.delegation/`.

## 3. Run

Terminal 1:

```bash
npm run tools
```

Terminal 2:

```bash
npm run dev
```

Open `http://localhost:3000` and click **Integrations**.

## 4. GitHub

Create an OAuth App or, preferably for a production SaaS, a GitHub App with repository-level permissions. The current local adapter uses an OAuth App because it is simple for local setup.

The server keeps the OAuth client secret and access token off the React client and encrypts the saved token at rest with AES-256-GCM.

## 5. Vercel

Register a Vercel OAuth integration and set the callback URL shown above. Vercel access is kept server-side. Production deployment remains approval-gated.

## 6. Agent permissions

The Integrations screen has an Agent Tool Manager. Permissions are stored per agent in browser localStorage and determine which tool groups are exposed to Gemini:

- GitHub
- Browser
- Terminal
- Vercel

The safe baseline disables destructive GitHub merge and production deployment.

## 7. Approval model

The following operations create approval requests before they can mutate external state:

- GitHub file edits
- Vercel preview deployment requests
- Future production deployment actions

The queue is visible in Integrations.

## 8. Terminal safety

Only these commands are allowed by default:

- `npm install`
- `npm run build`
- `npm run test`
- `npm run lint`

Do not expose this local server directly to the public internet without adding authentication, per-user sessions, CSRF protection, rate limits, and a stronger sandbox for command execution.

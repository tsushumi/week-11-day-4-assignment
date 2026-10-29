# Deployment Process

> Fill in the `YOUR-...` placeholders with your real URLs and add your screenshots (see [Evidence](#evidence-screenshots)).

## Frontend (Vercel)
- **URL**: https://YOUR-APP.vercel.app
- **Trigger**: Auto-deploys on every push to `main`
- **Build command**: `npm run build` (copies `frontend/` to `dist/` and writes `dist/config.js`)
- **Output directory**: `dist`
- **Config**: `vercel.json`
- **Environment variable**: `API_URL` = the Railway URL below (no trailing slash). It is baked in at build time, so redeploy after changing it.

## Backend (Railway)
- **URL**: https://YOUR-API.up.railway.app
- **Trigger**: Auto-deploys on every push to `main`
- **Start command**: `node --import ./instrument.js server.js` (the `--import` lets Sentry instrument Express; see [MONITORING.md](MONITORING.md))
- **Config**: `railway.json` (start command, `/api/health` health check, restart on failure)
- **Environment variables**:

| Variable | Value | Why |
| --- | --- | --- |
| `NODE_ENV` | `production` | Production mode |
| `JWT_SECRET` | a long random string | **Required.** The app refuses to sign tokens in production without it |
| `SENTRY_DSN` | your Sentry DSN | Optional. Enables error tracking |
| `FRONTEND_URL` | `https://YOUR-APP.vercel.app` | Optional. Lets `/api/status` check the frontend |
| `CORS_ORIGIN` | `https://YOUR-APP.vercel.app` | Optional. Defaults to `*`; set it to lock the API to your frontend |

`PORT` is provided by Railway automatically.

## How to deploy
1. Create a feature branch
2. Make changes and push
3. Open a PR to `main`
4. Wait for CI to pass (lint + tests)
5. Merge the PR
6. Vercel and Railway auto-deploy within 2 minutes

## How the deployment gate works
`.github/workflows/deploy.yml` runs on every push to `main` as a chain: **test -> deploy -> notify**.

- `deploy` has `needs: test`, so it is skipped if lint, tests or the frontend build fail.
- `notify` has `if: always()`, so it reports success, a deploy failure, or "blocked: tests failed" either way.
- Repository variables `FRONTEND_URL` and `API_URL` (optional) add the live URL to notifications and enable a post-deploy smoke test of `/api/health`.
- Secret `DISCORD_WEBHOOK_URL` (optional) sends a Discord embed. Without it, the same details are printed in the Actions log.

**Important limitation:** Vercel and Railway start building the moment `main` is pushed, in parallel with this workflow, so by default the `needs` gate documents that tests passed but cannot stop the platforms. For a hard gate:

- **Railway**: Service > Settings > enable **Wait for CI**. Railway then waits for the GitHub Actions checks on the commit to pass before deploying.
- **Vercel**: set `"git": { "deploymentEnabled": { "main": false } }` in `vercel.json` and deploy from the workflow with the Vercel CLI (or `amondnet/vercel-action`) in the `deploy` job, using `VERCEL_TOKEN`, `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` secrets. Preview deployments for PRs keep working through the Git integration only if you leave it enabled for other branches.

## How to rollback
- **Vercel**: Go to Deployments > click three dots on previous deployment > Promote to Production
- **Railway**: Go to Deployments > click Redeploy on a previous deployment
- Or revert the merge commit on `main` (`git revert -m 1 <merge-sha>`); the pipeline redeploys the previous code.

## Staging / Preview Deployments
- Every PR automatically gets a preview deployment on Vercel
- Preview URL format: `your-app-git-branch-name-username.vercel.app`
- Use preview deployments to test changes before merging to main
- Preview deployments are deleted when the PR is closed

How the team uses them:
1. Push a feature branch (or `staging`) and open a PR into `main`.
2. Vercel posts a comment on the PR with the unique preview URL.
3. Reviewers open the preview and test the exact code before approving the merge.
4. The preview talks to the production API unless you set a separate `API_URL` for the Preview environment in Vercel (Settings > Environment Variables).

- **Preview URL for my PR**: https://YOUR-PREVIEW-URL.vercel.app

## Evidence (screenshots)
Save screenshots in `docs/screenshots/` and link them here.

1. The visible change: the merge commit or PR on GitHub, e.g. `![Merge on GitHub](docs/screenshots/01-github-merge.png)`
2. The Vercel deployment log: `![Vercel deployment](docs/screenshots/02-vercel-deployment.png)`
3. The live site showing the change (heading "Deployment Demo v2" and the new footer date): `![Live site](docs/screenshots/03-live-site.png)`
4. Actions tab showing test -> deploy -> notify: `![Deploy workflow](docs/screenshots/04-actions-chain.png)`
5. Discord message or the notify job log: `![Notification](docs/screenshots/05-notification.png)`
6. Vercel preview URL on a pull request: `![Preview deployment](docs/screenshots/06-preview-pr.png)`

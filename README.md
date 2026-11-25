# Employee Salary Management: Frontend

Web app for an HR manager to manage salaries for 10,000 employees across 10 countries, and to see how the organisation pays people. Built with Next.js 16 and Mantine.

- Live app: [pay-scope-fe.vercel.app](https://pay-scope-fe.vercel.app/)
- Backend repo: [PayScope_Be](https://github.com/Labeeb-bilal/PayScope_Be). It also holds the architecture, measured results and scaling plan.

> The backend runs on Render's free plan. It sleeps after 15 minutes without traffic, so the first page load can take about a minute. After that the app is fast.

## Features

| Page | What HR can do |
|---|---|
| Employees (`/`) | Search, filter by country, department and level, sort, paginate, export CSV, add, edit and delete employees |
| Employee details | Change salary with a reason and effective date, see salary history and how pay compares with peers |
| Pay insights (`/insights`) | Headcount, payroll, pay by country, department and level, salary distribution, role benchmark, pay-equity flags |
| Ask AI (`/assistant`) | Ask questions in plain English. Answers come from the backend's real data, and the tools used are shown under each answer |

## Quick start

```bash
nvm use            # Node 22 (see .nvmrc)
npm ci
npm run dev        # http://localhost:3000
```

The app expects the backend on `http://localhost:4000`. Start it first (see the [backend repo](https://github.com/Labeeb-bilal/PayScope_Be)).

`.env.development` is committed (no secrets) and points the app at the local backend.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Static export to `out/` |
| `npm run preview` | Serves `out/` locally to check a production build |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | TypeScript check, no output files |
| `npm run check` | Typecheck, tests and build: what CI runs |

## Configuration

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes, in production | Backend base URL, e.g. `https://payscope-be.onrender.com` (no trailing slash needed) |

- The value is read at **build time** and built into the bundle. Changing it means rebuilding.
- If it is empty, the app calls `/api` on its own address. That only works when the backend is served from the same domain, so set it for any separate deployment.
- The build **fails** on a malformed URL (see [`src/lib/env.ts`](src/lib/env.ts)), so a typo can't ship.
- `NEXT_PUBLIC_*` values are visible to anyone using the site. **Never put secrets here**; they belong in the backend.
- See [`.env.production.example`](.env.production.example). Real `.env*` files are git-ignored.
- The backend's CORS settings must allow this site's origin.

## Deployment

The build is a plain static site (`out/`), so it runs on any static host or as a container.

### Container (any platform)

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=https://payscope-be.onrender.com -t salary-manager-frontend .
docker run -p 8080:8080 salary-manager-frontend   # http://localhost:8080, health check at /healthz
```

The image is nginx running as a non-root user. It sets security headers (CSP limited to the API origin, HSTS, nosniff, no framing), caches hashed assets for a year, and revalidates HTML on every request so deploys show up at once.

### Static hosts

On Vercel, Netlify, Cloudflare Pages or a Render static site:

- Build command: `npm run build`
- Output directory: `out`
- Set `NEXT_PUBLIC_API_URL` in the host's environment settings

To get the same security headers, copy them from `nginx/default.conf.template` into the host's headers settings (for Vercel, `vercel.json`).

The live app is deployed on Vercel from the `prod` branch.

## CI

`.github/workflows/ci.yml` runs on pushes to `prod` and on pull requests. It runs:

1. Type check
2. Tests
3. `npm audit` (high severity, production dependencies)
4. Build
5. Docker image build

Set `NEXT_PUBLIC_API_URL` as a repository variable (Settings → Secrets and variables → Actions → Variables) so the build has the API URL.

## Project layout

```
src/app/          routes: employees (/), insights, assistant; error and 404 pages
src/components/   UI by feature (employees, insights, assistant)
src/lib/          API client, env config, hooks, formatting, types
nginx/            production server config used by the Dockerfile
```

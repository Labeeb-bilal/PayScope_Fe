# ACME Salary Manager: Frontend

Next.js 16 + Mantine UI for the ACME Salary Manager: employee directory, salary changes with history, pay insights,
and the HR assistant. It talks to the [backend API](../backend) over HTTP and is deployed on its own.

## Quick start

```bash
nvm use            # Node 22 (see .nvmrc)
npm ci
npm run dev        # http://localhost:3000, expects the backend on http://localhost:4000
```

`.env.development` is committed (no secrets) and points the app at the local backend.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Dev server on port 3000 |
| `npm run build` | Static export to `out/` |
| `npm run preview` | Serves `out/` locally, to check a production build |
| `npm test` | Unit tests (Vitest) |
| `npm run typecheck` | TypeScript, no emit |
| `npm run check` | Typecheck + tests + build: what CI runs |

## Configuration

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | In production | Backend base URL, e.g. `https://api.example.com` (no trailing slash needed). Empty = same origin. |

- Values are read at **build time** and inlined into the bundle. Changing one means rebuilding.
- The build **fails** on a malformed URL (see [`src/lib/env.ts`](src/lib/env.ts)), so a typo can't ship.
- `NEXT_PUBLIC_*` values are visible to anyone using the site. **Never put secrets here**; they belong in the backend.
- See [`.env.production.example`](.env.production.example). Real `.env*` files are git-ignored.
- The backend's CORS settings must allow this site's origin.

## Deployment

The build is a plain static site (`out/`), so it runs on any static host or as a container.

**Container (any platform):**

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=https://api.example.com -t salary-manager-frontend .
docker run -p 8080:8080 salary-manager-frontend   # http://localhost:8080, health check at /healthz
```

The image is nginx running as a non-root user. It sets security headers (CSP limited to the API origin, HSTS,
nosniff, no framing), caches hashed assets for a year, and revalidates HTML on every request so deploys show up at once.

**Static hosts (Vercel, Netlify, Cloudflare Pages, Render static site):** build command `npm run build`, output
directory `out`, and set `NEXT_PUBLIC_API_URL` in the host's environment settings. Configure the security headers
from `nginx/default.conf.template` in the host's headers settings.

## CI

`.github/workflows/ci.yml` runs on pushes to `main` and `development` and on pull requests: typecheck, tests,
`npm audit` (high severity, production dependencies), build, and a Docker image build. Set `NEXT_PUBLIC_API_URL` as a
repository **variable** for the build.

## Project layout

```
src/app/          routes: directory (/), insights, assistant; error and 404 pages
src/components/   UI by feature (employees, insights, assistant)
src/lib/          API client, env config, hooks, formatting, types
nginx/            production server config used by the Dockerfile
```

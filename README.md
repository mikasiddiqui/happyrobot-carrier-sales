# Inbound Carrier Sales Console

Proof-of-concept solution for the HappyRobot FDE take-home challenge.

This project implements an inbound carrier sales workflow for a freight brokerage:
- carriers call a HappyRobot voice agent through a web-call trigger
- the agent verifies the carrier, searches loads, negotiates rate, and completes a mocked handoff
- post-call extraction and classification are persisted into a custom dashboard

The dashboard is intentionally separate from HappyRobot analytics so the solution demonstrates product thinking as well as workflow implementation.

## What is implemented

### HappyRobot workflow
- `Web Call` trigger
- inbound voice agent
- tool-backed carrier verification
- tool-backed load search
- tool-backed offer negotiation
- mocked transfer step
- post-call `AI Extract`
- post-call `AI Classify` for outcome
- post-call `AI Classify` for sentiment
- final webhook to persist the call record

### API
Located in [apps/api](./apps/api)

Endpoints:
- `GET /api/health`
- `POST /api/voice/token`
- `POST /api/carriers/verify`
- `POST /api/loads/search`
- `POST /api/offers/negotiate`
- `POST /api/mock-transfer`
- `POST /api/calls`
- `GET /api/dashboard/summary`
- `GET /api/calls`
- `DELETE /api/calls`
- `GET /api/loads`

### Web app
Located in [apps/web](./apps/web)

Features:
- embedded HappyRobot hosted call
- live operational dashboard
- recent activity feed
- loadboard inventory panel
- auto-refreshing metrics

### Seed data
Located in [data](./data)

- [data/loads.json](./data/loads.json)
- [data/carriers.json](./data/carriers.json)
- runtime call storage in `data/runtime/calls.json`

## Architecture

### Flow
1. The browser opens the HappyRobot hosted web-call experience.
2. The agent uses backend-backed tools to:
   - verify a carrier
   - search loads
   - evaluate a counteroffer
   - complete a mocked transfer
3. Post-call nodes extract structured data and classify outcome and sentiment.
4. HappyRobot sends the final payload to `POST /api/calls`.
5. The custom dashboard reads from the API and displays booking, verification, and negotiation metrics.

### Runtime persistence
This project uses file-backed persistence for the challenge:
- static data under `data/`
- runtime records under `data/runtime/`

That keeps the stack lightweight and easy to demo. In production, the next upgrade would be moving saved call records to SQLite or Postgres.

## Security model

The project includes basic API protections suitable for the challenge:

- HTTPS:
  - deployed: use a host that terminates TLS for you
- public API key:
  - dashboard-facing API routes and `POST /api/voice/token` can be protected with `API_PUBLIC_KEY`
  - the web app sends it as `x-api-key` when `VITE_API_PUBLIC_KEY` is configured
- internal API key:
  - HappyRobot tool and post-call webhooks are protected with `API_INTERNAL_KEY`
  - HappyRobot should send it as `x-internal-key`
- CORS allowlist:
  - configure `CORS_ALLOWED_ORIGINS` for deployed browser origins

Important note:
- `API_PUBLIC_KEY` is a lightweight challenge-grade control, not full end-user authentication
- for a stricter production setup, front the API with a proper authenticated backend or proxy layer

## FMCSA behavior

`POST /api/carriers/verify` is implemented to call the live FMCSA QCMobile API using `FMCSA_API_KEY`.

Current caveat:
- the live FMCSA endpoint is returning `403 Forbidden` with the currently provided key in this environment
- because of that, the challenge demo currently uses the seeded fallback path for known demo MC numbers

Behavior:
- non-production environments default to `ENABLE_SEED_CARRIER_FALLBACK=true`
- production defaults to `false`

If you have a working FMCSA key, set:
- `FMCSA_API_KEY=<real_key>`
- `ENABLE_SEED_CARRIER_FALLBACK=false`

## Local development

### Prerequisites
- Node.js 20+
- npm for `apps/api`
- pnpm for `apps/web`

### 1. Configure the API
Copy [apps/api/.env.example](./apps/api/.env.example) to `apps/api/.env`

Required values:
- `HAPPYROBOT_API_KEY`
- `HAPPYROBOT_WORKFLOW_ID`
- `HAPPYROBOT_ENV`
- `API_INTERNAL_KEY`

Optional but recommended:
- `API_PUBLIC_KEY`
- `CORS_ALLOWED_ORIGINS`
- `FMCSA_API_KEY`
- `ENABLE_SEED_CARRIER_FALLBACK`

### 2. Configure the web app
Copy [apps/web/.env.example](./apps/web/.env.example) to `apps/web/.env`

Typical local values:

```env
VITE_API_BASE_URL=http://localhost:3001
VITE_API_PUBLIC_KEY=
VITE_HAPPYROBOT_DEPLOYMENT_URL=https://platform.happyrobot.ai/deployments/<your-deployment>
```

### 3. Run the API
```bash
cd apps/api
npm run dev
```

### 4. Run the web app
```bash
cd apps/web
pnpm dev
```

### 5. Open the dashboard
- web: `http://localhost:5173`
- api: `http://localhost:3001`

## Docker

This repo includes:
- [apps/api/Dockerfile](./apps/api/Dockerfile)
- [apps/web/Dockerfile](./apps/web/Dockerfile)
- [compose.yml](./compose.yml)
- [compose.env.example](./compose.env.example)

### Quick start
1. Copy:

```bash
cp compose.env.example compose.env
```

2. Fill in the values in `compose.env`

3. Start the stack:

```bash
docker compose up --build
```

Services:
- dashboard: `http://localhost:3000`
- api: `http://localhost:3001`

### Notes
- runtime call records are mounted from `./data/runtime` into `/app/data/runtime`
- the API image copies static seed data from `data/`
- the web image is built with Vite build-time variables

## Deployment

### Recommended target: Railway

Railway is a good fit here because it gives you:
- managed HTTPS
- simple Docker deployment
- environment variables
- persistent volumes for file-backed runtime storage

Recommended structure:
- one Railway service for the API
- one Railway service for the web app

### API service
Deploy from:
- [apps/api/Dockerfile](./apps/api/Dockerfile)

Set env vars:
- `PORT=3001`
- `HAPPYROBOT_API_KEY`
- `HAPPYROBOT_WORKFLOW_ID`
- `HAPPYROBOT_ENV=staging` or `production`
- `FMCSA_API_KEY`
- `API_INTERNAL_KEY`
- `API_PUBLIC_KEY`
- `ENABLE_SEED_CARRIER_FALLBACK=false`
- `CORS_ALLOWED_ORIGINS=https://<your-web-domain>`

Attach a persistent volume at:
- `/app/data/runtime`

Why this path matters:
- the app reads static files from `/app/data`
- only runtime records should be mounted over `/app/data/runtime`

### Web service
Deploy from:
- [apps/web/Dockerfile](./apps/web/Dockerfile)

Set build variables:
- `VITE_API_BASE_URL=https://<your-api-domain>`
- `VITE_API_PUBLIC_KEY=<same public key used by the API, if enabled>`
- `VITE_HAPPYROBOT_DEPLOYMENT_URL=https://platform.happyrobot.ai/deployments/<your-happyrobot-deployment>`

### After deployment
1. Confirm the deployed API health route responds.
2. Update HappyRobot environment variables:
   - `backend_base_url=https://<your-api-domain>`
   - `api_internal_key=<your API_INTERNAL_KEY>`
3. Republish the HappyRobot workflow to the correct environment.
4. Open the deployed dashboard and run a full call through the embedded call surface.

## Reproducing the deployment

Minimum reproducible path:

1. Clone the repo.
2. Create:
   - `apps/api/.env`
   - `apps/web/.env`
   - or `compose.env`
3. Run locally with:
   - native Node commands, or
   - `docker compose up --build`
4. Deploy the API and web containers to Railway using the included Dockerfiles.
5. Set the HappyRobot webhook environment values to the deployed API base URL and internal key.

## HappyRobot configuration reference

The workflow should use:

### Tools
- `verify_carrier` -> `POST /api/carriers/verify`
- `search_loads` -> `POST /api/loads/search`
- `negotiate_offer` -> `POST /api/offers/negotiate`
- `mock_transfer` -> `POST /api/mock-transfer`

### Post-call
- `AI Extract`
- `AI Classify` for outcome
- `AI Classify` for sentiment
- `POST /api/calls`

### Required HappyRobot environment variables
- `backend_base_url`
- `api_internal_key`
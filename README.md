# Phoenix-Online User Service

Authentication, authorization, and user identity management for the Phoenix-Online event ticket booking platform. Provides user registration, login, JWT tokens, role-based access control (RBAC), and user profile management. Other microservices (Event, Ticket Inventory, Booking, Payment) rely on this service for identity and permissions.

## Tech stack

- **Runtime:** Node.js, Express
- **Database:** MySQL
- **ORM:** Prisma
- **Auth:** JWT, bcrypt

## Prerequisites

- Node.js 18+
- MySQL 8+
- (Optional) Docker for local MySQL via `docker-compose` to run locally

## Setup

1. **Clone and install**

   ```bash
   npm install
   ```

2. **Environment**

   Copy `.env.example` to `.env` and set:

   - `DATABASE_URL` — MySQL connection string, e.g. `mysql://user:password@localhost:3306/phoenix_user`
   - `JWT_SECRET` — Secret for signing JWTs (use a strong value in production)
   - `PORT` — Server port (default 3000)

3. **Database**

   ```bash
   npx prisma generate
   npx prisma migrate dev
   npx prisma db seed
   ```

4. **Run**

   ```bash
   npm run dev
   ```

   API base: `http://localhost:3000/api/v1/users`

## Scripts

| Command           | Description                    |
|-------------------|--------------------------------|
| `npm start`       | Start production server        |
| `npm run dev`     | Start with nodemon             |
| `npm run db:generate` | Generate Prisma client     |
| `npm run db:migrate`   | Apply migrations (prod)    |
| `npm run db:migrate:dev` | Create/apply migrations (dev) |
| `npm run db:seed` | Seed roles and permissions     |
| `npm run db:studio` | Open Prisma Studio          |
| `npm test`        | Run tests                      |
| `npm run lint`    | Run ESLint                     |

## Docker (optional)

To run MySQL and the app locally with Docker:

```bash
docker-compose up -d
```

See `docker-compose.yml` for services and ports. The `user-service` container uses a healthcheck on `/health/ready` with a 30s start period.

## Health and probes

| Endpoint        | Purpose    | Response |
|----------------|------------|----------|
| `GET /health`  | Liveness   | 200 when process is up (no DB check) |
| `GET /health/ready` | Readiness / startup | 200 when DB is reachable, 503 otherwise |

Use `/health` for liveness and `/health/ready` for readiness and startup probes (e.g. Kubernetes, Docker healthcheck).

## CI (GitHub Actions)

The pipeline mirrors [`phoenix-online-ticket-inventory-service`](../phoenix-online-ticket-inventory-service) (same triggers, concurrency, security scans, Sonar, GCP push, GitOps bump). Differences: **Node.js** build (lint, Jest + coverage, Prisma generate/migrate) with a **MySQL** service; **OSV Scanner** replaces Go’s `govulncheck` for dependency vulnerability SARIF.

**Triggers:** `push` and `pull_request` to `main` and `dev`.

**Jobs:** `build-test` → `osv-scanner`, `security` (Trivy), `sonar` (parallel) → `push-image` (push only) → `gitops-update` (push only).

**Secret:** `SONAR_TOKEN` — SonarQube Cloud token.

**Secret:** `GCP_SA_KEY` — service account JSON for pushing images.

**Repository variables:** `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_ARTIFACT_REGISTRY`, `GCP_IMAGE_NAME`.

Tags pushed: full commit SHA; plus `dev-latest` on `dev` and `main-latest` on `main`.

### GitOps (platform config repo)

After the image push succeeds, `gitops-update` bumps **`apps/user-service/overlays/<dev|prod>`** (same pattern as inventory’s `apps/inventory-service/...`).

**Secret:** `GITOPS_REPO_PAT` — PAT with **`contents: write`** on the platform config repo.

| Variable | Required | Description |
|----------|----------|-------------|
| `GITOPS_REPO` | Yes | GitHub repo in `owner/name` form (e.g. `Phoenix-Event-Ticketing/phoenix-online-platform-config`). |
| `GITOPS_KUSTOMIZE_IMAGE_NAME` | No | Must match `images[].name` in each overlay. If unset, defaults to the Artifact Registry image from `GCP_*` variables. |

Ensure the GitOps repo defines `apps/user-service/overlays/dev` and `apps/user-service/overlays/prod` (or adjust paths in `.github/workflows/ci.yml` to match your layout).

## API

Base path: `/api/v1/users`

- `POST /register` — Register user
- `POST /login` — Login (returns JWT)
- `GET /:id` — Get user profile (Bearer token)
- `PUT /:id` — Update profile (Bearer token)
- `PUT /:id/role` — Assign role (admin)
- `POST /batch` — Batch user lookup (for other services)

**Swagger UI:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs) (when the server is running).  
OpenAPI spec: `docs/openapi.yaml`.

## License

Private / UNLICENSED.

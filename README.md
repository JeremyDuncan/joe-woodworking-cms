# Custom CMS

A Docker-deployable CMS website

## What it includes

- Multi-page SPA public website: Home, Work, Options, Process, Contact
- Hidden admin page controlled by `ADMIN_PATH`
- Admin login with one or more users from `ADMIN_USERS`
- Admin password changes persisted in the database / mapped storage
- Add/edit/delete portfolio items
- Image and video uploads with pre-save preview
- Interactive image cropping/repositioning (drag + zoom) per portfolio image
- Apple HEIC/HEIF uploads auto-converted to JPEG (via `libheif-tools`, with a `sharp` fallback)
- Customizable website text/settings for each major page/section
- Built-in health check at `/api/health`

## Architecture

The backend auto-detects which storage backends to use based on environment variables:

| Concern        | When configured                          | Fallback when unset                         |
| -------------- | ---------------------------------------- | ------------------------------------------- |
| Structured data| PostgreSQL (`DATABASE_URL`)              | JSON files in `DATA_DIR` (`works.json`, etc.) |
| Media storage  | S3 / MinIO (`S3_*`)                      | Local files in `UPLOAD_DIR`                 |
| Sessions       | File-backed store in `DATA_DIR/sessions` | (always file-backed)                        |

The committed Compose stacks run the full setup (app + PostgreSQL + MinIO). A single
container with neither `DATABASE_URL` nor `S3_*` set will still work using JSON +
local-file fallbacks.

## Environment files

Configuration is supplied via two **gitignored** env files you must create locally:

- `.development-env` — used by the dev stack
- `.production-env` — used by the production stack and the `./deploy` script

Both are loaded through Compose `env_file:`. They share the same keys (grouped by
section). Example layout:

```dotenv
# Deploy config (used by ./deploy and ${REGISTRY}/${IMAGE} in docker-compose.yml)
REGISTRY=192.168.1.123:5000
IMAGE=joes-custom-flags-cms

# CMS config
NODE_ENV=production
PORT=8080
ADMIN_PATH=/woodshop-admin-976bd496
ADMIN_USERS=jeremy:change-me,uncle:change-me-too
SESSION_SECRET=replace-with-a-long-random-string

# MinIO / S3 media storage
S3_ENDPOINT=http://minio:9000
S3_REGION=us-east-1
S3_BUCKET=joes-custom-flags-cms-media
S3_ACCESS_KEY=miniojoecms
S3_SECRET_KEY=super-secret-minio-password
S3_FORCE_PATH_STYLE=true
MAX_FILE_MB=500
MINIO_ROOT_USER=miniojoecms
MINIO_ROOT_PASSWORD=super-secret-minio-password

# PostgreSQL (the app derives DATABASE_URL from these)
POSTGRES_DB=joes_custom_flags
POSTGRES_USER=cms
POSTGRES_PASSWORD=super-secret-postgres-password
```

> **Important:** `S3_ACCESS_KEY` must match `MINIO_ROOT_USER` and `S3_SECRET_KEY` must
> match `MINIO_ROOT_PASSWORD`, or media uploads fail with `InvalidAccessKeyId` /
> `SignatureDoesNotMatch`. Hostnames `postgres` and `minio` are the Compose service
> names.
>
> You don't normally set `DATABASE_URL` — the app builds it from `POSTGRES_USER`,
> `POSTGRES_PASSWORD`, and `POSTGRES_DB` (host `postgres`, port `5432` by default,
> overridable via `POSTGRES_HOST` / `POSTGRES_PORT`). Set `DATABASE_URL` explicitly only
> to point at an external database.

### Key reference

- `REGISTRY` / `IMAGE` — image coordinates for the local registry (deploy + compose)
- `PORT` — container HTTP port, default `8080`
- `ADMIN_PATH` — secret admin URL path, e.g. `/woodshop-admin-976bd496`
- `ADMIN_USERS` — comma-separated `user:password` pairs; seeds users when none exist
- `SESSION_SECRET` — long random string for session signing
- `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` — Postgres setup; the app derives `DATABASE_URL` from these. Omit all to use JSON files instead.
- `POSTGRES_HOST` / `POSTGRES_PORT` — optional DB host/port overrides (default `postgres` / `5432`)
- `DATABASE_URL` — optional explicit connection string; overrides the derived value (e.g. for an external database)
- `S3_ENDPOINT` / `S3_REGION` / `S3_BUCKET` / `S3_ACCESS_KEY` / `S3_SECRET_KEY` / `S3_FORCE_PATH_STYLE` — media storage; omit to use local files
- `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` — MinIO container credentials
- `MAX_FILE_MB` — max upload size in MB, default `500`
- `DATA_DIR` / `UPLOAD_DIR` — in-container paths, default `/app/data` and `/app/data/uploads`

## Compose files

| File                       | Purpose                                                                 |
| -------------------------- | ----------------------------------------------------------------------- |
| `docker-compose.yml`       | Production/NAS stack. Pulls `${REGISTRY}/${IMAGE}:latest`. Uses `.production-env`. |
| `docker-compose.build.yml` | Builds the image locally and tags it `joes-custom-flags-cms:latest`.    |
| `docker-compose.dev.yml`   | Full local dev stack (app + Postgres + MinIO). Uses `.development-env`.  |

## Local development

Start the full dev stack (app, Postgres, MinIO) with live reload:

```bash
./start-dev
```

This runs `docker compose -f docker-compose.dev.yml --env-file .development-env up`.

Then open:

- App (Vite dev server): http://localhost:5173
- API (Express): http://localhost:8080
- MinIO console: http://localhost:9001

Admin page is at `http://localhost:5173<ADMIN_PATH>` (e.g. `/login` in dev).

## Build & deploy

The production stack pulls a pre-built image from a local Docker registry
(`192.168.1.123:5000`). Build and push with:

```bash
./deploy
```

This sources `.production-env`, builds via `docker-compose.build.yml`, tags the image
as `${REGISTRY}/${IMAGE}:latest`, and pushes it to the registry. Then pull and redeploy
the stack in Portainer to roll out the new image.

> The registry is served over plain HTTP, so Docker must allow it as an insecure
> registry. On Docker Desktop add to **Settings → Docker Engine**:
>
> ```json
> { "insecure-registries": ["192.168.1.123:5000"] }
> ```

### Production stack

`docker-compose.yml` runs the app on port `3015` and bind-mounts persistent data on the
NAS:

```text
/share/Public/docker/joes-custom-flags-cms/app-data         -> /app/data
/share/Public/docker/joes-custom-flags-cms/postgres-data-v2/db -> Postgres data
/share/Public/docker/joes-custom-flags-cms/minio            -> MinIO data
```

Because the image and other values use `${VAR}` substitution, Portainer must have the
`.production-env` values available (point the stack at the env file or paste the
variables into Portainer's environment editor).

Default admin path: `http://<host>:3015/woodshop-admin-976bd496`

## Reverse proxy

For the public setup, proxy to the Docker host on port `3015`:

- Scheme: `http`
- Forward port: `3015`
- SSL: Let's Encrypt, Force SSL + HTTP/2 enabled

## Health check

```bash
curl http://localhost:3015/api/health
```

Example response:

```json
{"ok":true,"adminPath":"/woodshop-admin-976bd496","storage":{"sql":true,"s3":true}}
```

## Tests

```bash
npm test
npm run build
```

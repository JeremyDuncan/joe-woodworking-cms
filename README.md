# Joe's Custom Flags CMS

A Docker-deployable CMS website for Joe's custom flags / woodshop portfolio.

## What it includes

- Multi-page SPA public website: Home, Work, Options, Process, Contact
- Hidden admin page controlled by `ADMIN_PATH`
- Admin login with one or more users from `ADMIN_USERS`
- Admin password changes persisted in mapped storage
- Add/edit/delete portfolio items
- Image and video uploads with pre-save confirmation previews
- Customizable website text/settings for each major page/section
- Persistent JSON data, uploaded media, and file-backed sessions through Docker volumes
- Built-in health check at `/api/health`

## Quick start with Docker Compose

From this folder:

```bash
docker compose up -d --build
```

Then open:

```text
http://localhost:3015
```

Admin path defaults to:

```text
http://localhost:3015/woodshop-admin-976bd496
```

## Required persistent volumes

The app stores all mutable CMS data outside the container:

- `/app/data` — CMS JSON database files:
  - `works.json`
  - `settings.json`
  - `admin-users.json`
  - `sessions/`
- `/app/uploads` — uploaded images/videos

The included `docker-compose.yml` maps those to:

```text
/home/jeremy/data/joes-custom-flags-cms/data:/app/data
/home/jeremy/data/joes-custom-flags-cms/uploads:/app/uploads
```

For NAS deployment, use NAS-native bind mounts:

```text
/share/ZFS530_DATA/.qpkg/container-station/docker/joes-custom-flags-cms/data:/app/data
/share/ZFS530_DATA/.qpkg/container-station/docker/joes-custom-flags-cms/uploads:/app/uploads
```

## Environment variables

- `PORT` — container HTTP port, default `8080`
- `ADMIN_PATH` — secret admin URL path, e.g. `/woodshop-admin-976bd496`
- `ADMIN_USERS` — comma-separated username/password pairs, e.g. `jeremy:password1,uncle:password2`. Used only to seed `admin-users.json` when it does not exist.
- `SESSION_SECRET` — long random string for session signing
- `DATA_DIR` — data directory inside container, default `/app/data`
- `UPLOAD_DIR` — uploads directory inside container, default `/app/uploads`
- `MAX_FILE_MB` — max upload size in MB, default `500`

## Build manually

```bash
docker build -t joes-custom-flags-cms:latest .
```

Run manually:

```bash
docker run -d \
  --name joes-custom-flags-cms \
  --restart unless-stopped \
  -p 3015:8080 \
  -e NODE_ENV=production \
  -e PORT=8080 \
  -e ADMIN_PATH=/woodshop-admin-976bd496 \
  -e 'ADMIN_USERS=jeremy:change-me,uncle:change-me-too' \
  -e SESSION_SECRET='replace-with-a-long-random-string' \
  -e DATA_DIR=/app/data \
  -e UPLOAD_DIR=/app/uploads \
  -e MAX_FILE_MB=500 \
  -v /home/jeremy/data/joes-custom-flags-cms/data:/app/data \
  -v /home/jeremy/data/joes-custom-flags-cms/uploads:/app/uploads \
  joes-custom-flags-cms:latest
```

## Nginx Proxy Manager

For Jeremy's normal public setup, proxy:

- Domain: `example1.jeremyd.net`
- Scheme: `http`
- Forward hostname/IP: Docker host IP
- Forward port: `3015`
- SSL: Let's Encrypt enabled
- Force SSL: enabled
- HTTP/2: enabled

## Health check

```bash
curl http://localhost:3015/api/health
```

Expected:

```json
{"ok":true}
```

## Tests

```bash
npm test
npm run build
```

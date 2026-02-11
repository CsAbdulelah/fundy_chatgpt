# Fundy KYC Builder

## Quick Start (Docker)

```bash
docker compose up --build
```
The backend container now auto-runs:
- `.env` bootstrap (`.env.docker` fallback)
- `php artisan key:generate` (if missing)
- `php artisan migrate`

Open:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000/api

### Common commands

```bash
# start in background
docker compose up -d --build

# stop
docker compose down

# reset database volume
docker compose down -v
```

## Local (without Docker)

Use your current local setup for Laravel + Vite.

---

If you need seeded users, run tinker:

```bash
docker compose run --rm backend php artisan tinker
```

Then create users/teams as discussed.

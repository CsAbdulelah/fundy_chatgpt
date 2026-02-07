# Fundy KYC Builder

## Quick Start (Docker)

```bash
docker compose up --build
```

### First-time setup

```bash
docker compose run --rm backend cp .env.docker .env
docker compose run --rm backend php artisan key:generate
docker compose run --rm backend php artisan migrate
```

Open:
- Frontend: http://localhost:5173
- Backend: http://localhost:8000/api

## Local (without Docker)

Use your current local setup for Laravel + Vite.

---

If you need seeded users, run tinker:

```bash
docker compose run --rm backend php artisan tinker
```

Then create users/teams as discussed.

#!/usr/bin/env sh
set -eu

cd /var/www/html

if [ ! -f .env ]; then
  if [ -f .env.docker ]; then
    cp .env.docker .env
  else
    cp .env.example .env
  fi
fi

if [ ! -d vendor ]; then
  composer install --no-interaction --no-progress --prefer-dist
fi

if ! grep -q "^APP_KEY=base64:" .env; then
  php artisan key:generate --force
fi

until pg_isready -h "${DB_HOST:-db}" -p "${DB_PORT:-5432}" -U "${DB_USERNAME:-postgres}" >/dev/null 2>&1; do
  echo "Waiting for database..."
  sleep 2
done

php artisan migrate --force

exec php artisan serve --host=0.0.0.0 --port=8000

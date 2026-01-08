echo "Waiting for Postgres"
until nc -z postgres 5432; do
  sleep 1
done

echo "Postgres is OK"

echo "Migrations executing"
yarn typeorm migration:run

echo "Starting Shortener API!"
exec "$@"
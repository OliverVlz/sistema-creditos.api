#!/bin/bash
set -e

echo "🚀 Iniciando contenedor de sistema-creditos.api..."

echo "⏳ Esperando a que PostgreSQL esté disponible..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" > /dev/null 2>&1; do
  echo "   PostgreSQL no está listo - esperando..."
  sleep 2
done

echo "✅ PostgreSQL está disponible"

echo "🔨 Construyendo la aplicación..."
pnpm build

if [ "$FORCE_SEED" = "true" ]; then
  echo "🌱 FORCE_SEED activado - ejecutando seeders..."
  node dist/shared/commands/seed.command.js
else
  echo "🔍 Verificando si la base de datos necesita seeders..."
  
  USER_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -t -c "SELECT COUNT(*) FROM \"user\";" 2>/dev/null || echo "0")
  USER_COUNT=$(echo $USER_COUNT | xargs)

  if [ "$USER_COUNT" = "0" ]; then
    echo "🌱 Base de datos vacía - ejecutando seeders..."
    node dist/shared/commands/seed.command.js
  else
    echo "✅ Base de datos ya tiene datos ($USER_COUNT usuarios) - omitiendo seeders"
  fi
fi

echo "🎉 Inicialización completada - iniciando aplicación..."
echo ""

exec "$@"


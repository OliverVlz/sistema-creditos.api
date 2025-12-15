#!/bin/bash
set -e

echo "🚀 Iniciando contenedor de sistema-creditos.api..."

echo "⏳ Esperando a que PostgreSQL esté disponible..."
until pg_isready -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" > /dev/null 2>&1; do
  echo "   PostgreSQL no está listo - esperando..."
  sleep 2
done

echo "✅ PostgreSQL está disponible"

echo "🗄️  Verificando/Creando base de datos '$DB_DATABASE'..."
DB_EXISTS=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_DATABASE'" | xargs)
if [ "$DB_EXISTS" != "1" ]; then
  echo "   Creando base de datos '$DB_DATABASE'..."
  PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d postgres -c "CREATE DATABASE $DB_DATABASE;" > /dev/null 2>&1
  echo "   ✅ Base de datos '$DB_DATABASE' creada"
else
  echo "   ✅ Base de datos '$DB_DATABASE' ya existe"
fi

if [ "$NODE_ENV" != "production" ] || [ ! -d "dist" ]; then
  echo "🔨 Construyendo la aplicación..."
  pnpm build
else
  echo "✅ Aplicación ya compilada (producción)"
fi

if [ "$FORCE_SEED" = "true" ]; then
  echo "🌱 FORCE_SEED activado - ejecutando seeders..."
  node dist/shared/commands/seed.command.js
elif [ "$NODE_ENV" != "production" ]; then
  echo "🔍 Verificando si la base de datos necesita seeders..."
  
  USER_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -t -c "SELECT COUNT(*) FROM \"user\";" 2>/dev/null || echo "0")
  USER_COUNT=$(echo $USER_COUNT | xargs)

  if [ "$USER_COUNT" = "0" ]; then
    echo "🌱 Base de datos vacía - ejecutando seeders..."
    node dist/shared/commands/seed.command.js
  else
    echo "✅ Base de datos ya tiene datos ($USER_COUNT usuarios) - omitiendo seeders"
  fi
else
  echo "🔍 Verificando si la base de datos necesita esquema inicial..."
  
  TABLE_COUNT=$(PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USERNAME" -d "$DB_DATABASE" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('users', 'clients', 'organizations');" 2>/dev/null || echo "0")
  TABLE_COUNT=$(echo $TABLE_COUNT | xargs)

  if [ "$TABLE_COUNT" -lt "3" ]; then
    echo "📦 Base de datos vacía - creando esquema inicial (sin seeders)..."
    SKIP_SEEDERS=true node dist/shared/commands/seed.command.js
  else
    echo "✅ Esquema de base de datos ya existe"
  fi
fi

echo "🎉 Inicialización completada - iniciando aplicación..."
echo ""

exec "$@"


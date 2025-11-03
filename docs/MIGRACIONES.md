# Guía de Migraciones de Base de Datos

## 📚 ¿Qué son las migraciones?

Las migraciones son una forma de versionar y gestionar cambios en el esquema de la base de datos de manera controlada y reversible.

## 🎯 ¿Cuándo usar migraciones?

### ✅ USA migraciones cuando:
- Necesites mover datos entre tablas/columnas
- Cambies tipos de datos que ya tienen información
- Agregues restricciones (NOT NULL, UNIQUE) a columnas existentes
- Necesites transformar datos existentes

### ❌ NO necesitas migraciones cuando:
- Estás en desarrollo temprano y puedes resetear la BD
- Solo estás agregando nuevas tablas/columnas sin datos
- `synchronize: true` puede manejar el cambio automáticamente

## 🚀 Scripts disponibles

```bash
# Ver migraciones pendientes
pnpm migration:show

# Ejecutar migraciones pendientes
pnpm migration:run

# Revertir la última migración
pnpm migration:revert

# Crear una nueva migración manualmente
pnpm migration:create src/db/migrations/NombreMigracion

# Generar migración desde cambios en entidades (auto-detect)
pnpm migration:generate src/db/migrations/NombreMigracion
```

## 📝 Migración actual: MoveDocumentAndPhoneToUser

### Qué hace:
1. Agrega `document_number` y `phone_number` a tabla `users`
2. Copia datos existentes desde `clients` a `users`
3. Genera valores temporales para usuarios sin cliente
4. Hace `document_number` NOT NULL y UNIQUE
5. Elimina las columnas de `clients`

### Cómo ejecutarla:

#### Opción 1: Local (desarrollo)

```bash
# 1. Asegúrate de que la BD exista
# 2. Ejecutar migración
pnpm migration:run

# 3. Ejecutar seeds
pnpm seed
```

#### Opción 2: Docker

```bash
# Resetear BD (más simple en desarrollo)
docker-compose down -v
docker-compose up -d

# O ejecutar migración manualmente
docker-compose exec app pnpm migration:run
docker-compose exec app pnpm seed
```

### Rollback (revertir):

```bash
# Local
pnpm migration:revert

# Docker
docker-compose exec app pnpm migration:revert
```

## 🔄 Flujo de trabajo con migraciones

### Desarrollo:
```bash
# 1. Cambiar entidades
# 2. Crear/generar migración si es necesario
pnpm migration:generate src/db/migrations/MiCambio

# 3. Revisar archivo generado
# 4. Ejecutar migración
pnpm migration:run

# 5. Probar
pnpm start
```

### Producción:
```bash
# Las migraciones se ejecutan automáticamente al iniciar
# gracias a: migrationsRun: true
```

## 🏗️ Crear una migración manual

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class MiNuevaMigracion1234567890000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Código para aplicar cambios
    await queryRunner.query(`
      ALTER TABLE "mi_tabla" ADD COLUMN "mi_columna" VARCHAR
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Código para revertir cambios
    await queryRunner.query(`
      ALTER TABLE "mi_tabla" DROP COLUMN "mi_columna"
    `);
  }
}
```

## ⚠️ Importante

1. **SIEMPRE** haz backup antes de ejecutar migraciones en producción
2. **PRUEBA** las migraciones en local/staging primero
3. **REVISA** el código SQL generado antes de ejecutarlo
4. Las migraciones deben ser **idempotentes** (usar IF EXISTS, IF NOT EXISTS)
5. Documenta qué hace cada migración

## 🐛 Troubleshooting

### Error: "column contains null values"

Significa que estás intentando hacer una columna NOT NULL pero ya tiene datos nulos.

**Solución:**
1. Agrega la columna como nullable primero
2. Actualiza los valores nulos
3. Luego haz la columna NOT NULL

Ejemplo:
```typescript
// ❌ MAL
await queryRunner.query(
  `ALTER TABLE "users" ADD COLUMN "document_number" VARCHAR NOT NULL`
);

// ✅ BIEN
await queryRunner.query(
  `ALTER TABLE "users" ADD COLUMN "document_number" VARCHAR`
);
await queryRunner.query(
  `UPDATE "users" SET "document_number" = 'DEFAULT' WHERE "document_number" IS NULL`
);
await queryRunner.query(
  `ALTER TABLE "users" ALTER COLUMN "document_number" SET NOT NULL`
);
```

### Error: Migration already executed

Si necesitas re-ejecutar:
```bash
# Revertir
pnpm migration:revert

# Ejecutar de nuevo
pnpm migration:run
```

### Resetear todo (solo desarrollo)

```bash
# Local
psql -U postgres -c "DROP DATABASE sistema_creditos;"
psql -U postgres -c "CREATE DATABASE sistema_creditos;"
pnpm migration:run
pnpm seed

# Docker
docker-compose down -v
docker-compose up -d
```

## 📊 Estado de migraciones

TypeORM guarda el estado en la tabla `migrations`:

```sql
SELECT * FROM migrations;
```

Esto te muestra qué migraciones ya se ejecutaron y cuándo.


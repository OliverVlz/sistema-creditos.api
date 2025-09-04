# Sistema de Créditos - API

API backend para el sistema de gestión de créditos desarrollada con NestJS.

## 🚀 Inicio Rápido

### 🏠 Desarrollo Local

**Configuración inicial:**

```bash
# 1. Configurar entorno local
pnpm env:local

# 2. Configurar base de datos
pnpm db:setup

# 3. Instalar dependencias
pnpm install

# 4. Iniciar servidor (crea tablas automáticamente)
pnpm start

# 5. En otra terminal: Poblar datos de prueba
pnpm seed
```

**Comandos de desarrollo local:**

```bash
pnpm start                # 🟢 Iniciar servidor (modo watch)
pnpm start:dev            # 🟢 Iniciar servidor (alias de start)
pnpm start:debug          # 🔍 Iniciar con debugger
pnpm build                # 📦 Construir proyecto
pnpm migration:run        # ⬆️  Ejecutar migraciones
pnpm migration:revert     # ⬇️ Revertir última migración
pnpm seed                 # 🌱 Poblar datos de prueba
```

### 🐳 Desarrollo con Docker

**Configuración inicial:**

```bash
# 1. Configurar entorno Docker
pnpm env:docker

# 2. Iniciar con Docker
pnpm docker:up
```

**Comandos de Docker:**

```bash
pnpm docker:up           # 🟢 Iniciar containers (con build)
pnpm docker:start        # ▶️  Iniciar containers existentes
pnpm docker:down         # 🛑 Detener containers
pnpm docker:logs         # 📄 Ver logs en tiempo real
pnpm docker:seed         # 🌱 Poblar datos dentro del container
pnpm docker:clean        # 🧹 Limpiar todo (containers, volumes, images)
```

### ** Docker Compose directo (Ultra simple)**

```bash
docker-compose up --build              # Levantar proyecto
docker-compose exec app pnpm seed      # Ejecutar seed
```

## 🛠️ Scripts Adicionales

### Configuración de Entorno

```bash
pnpm env:local           # 🏠 Configurar para desarrollo local
pnpm env:docker          # 🐳 Configurar para Docker
```

### Base de Datos Local

```bash
pnpm db:setup            # 🔧 Configurar base de datos local automáticamente
pnpm db:create           # 📊 Crear base de datos usando SQL
```

### Testing

```bash
pnpm test                # 🧪 Ejecutar tests
pnpm test:watch          # 👀 Tests en modo watch
pnpm test:cov            # 📊 Tests con cobertura
pnpm test:e2e            # 🔄 Tests end-to-end
```

### Calidad de Código

```bash
pnpm lint                # 🔍 Linter y corrección automática
pnpm format              # 💅 Formatear código
```

### Utilidades

```bash
pnpm mail:up             # 📧 Iniciar servidor de email local
pnpm mail:dev            # 📧 Servidor de desarrollo para templates
```

## 🏗️ Tecnologías

- **Framework**: NestJS
- **Base de Datos**: PostgreSQL
- **ORM**: TypeORM
- **Autenticación**: JWT
- **Validación**: class-validator
- **Documentación**: Swagger
- **Package Manager**: pnpm

## 📍 URLs de Desarrollo

- **API Local**: http://localhost:3000
- **Swagger**: http://localhost:3000/api
- **Cliente Frontend**: http://localhost:5173

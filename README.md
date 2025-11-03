# Sistema de Créditos - API

API backend para el sistema de gestión de créditos desarrollada con NestJS.

## ✨ Características Destacadas

- 🎯 **Seeders Inteligentes**: Los seeders se ejecutan automáticamente solo cuando la BD está vacía, evitando duplicados
- 🐳 **Docker Optimizado**: Diferencia entre construcción y ejecución del contenedor
- 🔄 **Hot Reload**: Desarrollo ágil con recarga automática de cambios
- 📦 **Multi-stage Build**: Imágenes optimizadas para desarrollo y producción
- 🛡️ **TypeScript + NestJS**: Código tipado y arquitectura escalable

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
# 1. Asegúrate de tener un .env con tus variables
# (Las variables de BD se configuran automáticamente en docker-compose.yml)

# 2. Iniciar con Docker (primera vez)
pnpm docker:up
```


> 🎯 **Seeders Inteligentes**: Los seeders se ejecutan automáticamente solo si la base de datos está vacía. En reinicios, se omiten para evitar duplicados.

**Comandos principales:**

```bash
pnpm docker:up           # 🟢 Iniciar con build (seeders automáticos si BD vacía)
pnpm docker:start        # ▶️  Iniciar sin build
pnpm docker:restart      # 🔄 Reiniciar solo la app (rápido)
pnpm docker:rebuild      # 🔨 Rebuild completo (limpia BD + seeders)
pnpm docker:down         # 🛑 Detener containers
pnpm docker:logs         # 📄 Ver logs en tiempo real
pnpm docker:shell        # 💻 Acceder al shell del container
pnpm docker:clean        # 🧹 Limpiar todo (containers, volumes, images)
```

**Comandos de seeders:**

```bash
pnpm docker:seed         # 🌱 Ejecutar seeders manualmente
pnpm docker:seed:force   # 🔥 Forzar ejecución de seeders
```

### 📘 Diferencia entre BUILD y RUN

**BUILD** (`docker build`):

- Solo prepara la imagen con código y dependencias
- NO ejecuta base de datos ni seeders
- Resultado: imagen reutilizable

**RUN** (`docker-compose up`):

- Espera a que PostgreSQL esté listo
- Construye la aplicación
- Verifica si la BD está vacía
- Ejecuta seeders automáticamente (solo si es necesario)
- Inicia la aplicación

## 🛠️ Scripts Adicionales


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
- **Autenticación**: JWT + Passport
- **Validación**: class-validator
- **Documentación**: Swagger/OpenAPI
- **Package Manager**: pnpm
- **Containerización**: Docker + Docker Compose

## ⚙️ Requisitos

- **Node.js**: >= 20.7.0
- **PostgreSQL**: >= 16 (o Docker)
- **pnpm**: >= 8.0 (recomendado) o Yarn
- **Docker**: >= 24.0 (opcional, para desarrollo con contenedores)

## 📍 URLs de Desarrollo

- **API Local**: http://localhost:3000
- **Swagger**: http://localhost:3000/api
- **Cliente Frontend**: http://localhost:5173

## 🔄 Flujos de Trabajo Comunes

### Desarrollo Diario con Docker

```bash
# Primer día
pnpm docker:up          # Crea BD, ejecuta seeders y levanta la app

# Días siguientes
pnpm docker:start       # Solo levanta los containers (mantiene datos)
```

### Cambios en Esquema de Base de Datos

```bash
# Cuando modificas entidades o quieres empezar de cero
pnpm docker:rebuild     # Limpia BD, reconstruye y ejecuta seeders
```

### Desarrollo sin Docker

```bash
# Primera vez
pnpm env:local
pnpm db:setup
pnpm install
pnpm start
pnpm seed

# Días siguientes
pnpm start
```

## 📚 Documentación

La documentación completa del sistema está disponible en la carpeta [`docs/`](./docs/):


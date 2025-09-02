# 🐳 Uso de Docker para Chevrokia System POS

## 📋 Requisitos
- Docker
- Docker Compose

## 🚀 Comandos Súper Simplificados

### **⚡ Opción 1: Docker Compose directo (Ultra simple)**
```bash
docker-compose up --build              # Levantar proyecto
docker-compose exec app pnpm seed      # Ejecutar seed
docker-compose down                     # Parar servicios
docker-compose logs -f                  # Ver logs
```

### **⚡ Opción 2: Scripts pnpm**
```bash
pnpm docker:dev              # Levantar proyecto
pnpm docker:dev:seed         # Ejecutar seed
pnpm docker:dev:down         # Parar servicios
pnpm docker:dev:logs         # Ver logs
```

## 🎯 Setup súper rápido en PC nueva

```bash
# 1. Clonar y entrar al directorio
git clone [URL_REPO]
cd c

# 2. Crear .env.docker (ver contenido abajo)

# 3. ¡Solo dos comandos!
docker-compose up --build
# Esperar que inicie, luego en otra terminal:
docker-compose exec app pnpm seed

# ¡Listo! → http://localhost:3000
```

## 🔧 Contenido de .env.docker

```env
# Application Configuration
NODE_ENV=development
PORT=3000
WEB_BASE_URL=http://localhost:3000
PASSWORD_RECOVERY_EXPIRATION=15min

# Database Configuration (MySQL) - Para Docker
DB_HOST=mysql
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=root
DB_DATABASE=pos_system

# JWT Configuration
JWT_SECRET=tu_jwt_secreto_muy_seguro_aqui_cambiar_en_produccion
JWT_EXPIRES_IN=7d

# Resto de configuración
LOKI_ENABLED=false
LOKI_HOST=http://localhost:3100
LOKI_SUFFIX_APP=default
CORS_ORIGINS=*
RECAPTCHA_ENABLED=false
RECAPTCHA_SECRET=
MAIL_HOST=localhost
MAIL_PORT=1025
MAIL_USER=usuario
MAIL_PASSWORD=contraseña
MAIL_FROM=no-reply@localhost
```

## 🌐 Acceso
- **Aplicación**: http://localhost:3000
- **Swagger API**: http://localhost:3000/api
- **MySQL**: localhost:3307

## 📋 Todos los comandos disponibles

### **Con Docker Compose directo:**
```bash
# Desarrollo (por defecto)
docker-compose up --build                    # Levantar
docker-compose up -d --build                 # Levantar en background
docker-compose exec app pnpm seed            # Ejecutar seed
docker-compose exec app pnpm migration:run   # Ejecutar migraciones
docker-compose logs -f                       # Ver logs
docker-compose down                          # Parar servicios
docker-compose down -v                       # Limpiar todo (incluyendo DB)

# Producción
docker-compose -f docker-compose.prod.yml up --build
docker-compose -f docker-compose.prod.yml exec app pnpm seed
```

### **Con Scripts pnpm:**
```bash
pnpm docker:dev              # Levantar proyecto
pnpm docker:dev:up           # Levantar en background
pnpm docker:dev:seed         # Ejecutar seed
pnpm docker:dev:logs         # Ver logs
pnpm docker:dev:down         # Parar servicios
pnpm docker:clean            # Limpiar todo

# Producción
pnpm docker:prod             # Levantar en producción
pnpm docker:prod:seed        # Seed en producción
```

## 🚨 Comandos para PC nueva (copy-paste completo)

### **Opción A: Docker Compose directo**
```bash
git clone [URL_REPOSITORIO]
cd sistema-creditos.api

# Crear .env.docker (copiar contenido de arriba)

# Levantar proyecto
docker-compose up --build

# En otra terminal - ejecutar seed
docker-compose exec app pnpm seed

# ¡Listo! → http://localhost:3000
```

### **Opción B: Con pnpm scripts**
```bash
git clone [URL_REPOSITORIO]
cd BACKEND_CHEVROKIA_SYSTEMPOS

# Crear .env.docker (copiar contenido de arriba)

# Levantar proyecto
pnpm docker:dev

# En otra terminal - ejecutar seed
pnpm docker:dev:seed

# ¡Listo! → http://localhost:3000
```

## 🎯 ¿Qué cambió?

✅ **Comandos súper simples**: `docker-compose up --build` y `docker-compose exec app pnpm seed`  
✅ **Docker Compose por defecto**: No más `-f docker-compose.dev.yml`  
✅ **2 formas de usar**: Docker Compose directo o pnpm scripts  
✅ **Sin Makefile**: Solo Docker nativo y scripts pnpm  

**¡Ahora es súper fácil para cualquier desarrollador nuevo!** 🚀 
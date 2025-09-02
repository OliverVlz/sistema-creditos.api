# Dockerfile para sistema-creditos.api
FROM node:20-alpine AS base

# Instalar pnpm globalmente
RUN npm install -g pnpm

WORKDIR /app

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Exponer puerto
EXPOSE 3000

# Etapa de desarrollo
FROM base AS development
CMD ["pnpm", "start:dev"]

# Etapa de producción
FROM base AS production

# Construir la aplicación
RUN pnpm build

# Comando para ejecutar en producción
CMD ["pnpm", "start:prod"]
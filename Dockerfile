# ---------------------------------------
# 1. Base (Setup común)
# ---------------------------------------
  FROM node:20-alpine AS base
  RUN npm install -g pnpm
  WORKDIR /app
  COPY package.json pnpm-lock.yaml ./
  
  # ---------------------------------------
  # 2. Development (Para desarrollo con hot-reload)
  # ---------------------------------------
  FROM base AS development
  # Instalamos TODO (dev + prod) para desarrollo
  RUN pnpm install --frozen-lockfile
  # Herramientas necesarias
  RUN apk add --no-cache postgresql-client bash
  # Entrypoint
  COPY docker-entrypoint.sh /usr/local/bin/
  RUN chmod +x /usr/local/bin/docker-entrypoint.sh
  # El código se monta como volumen en docker-compose
  ENV NODE_ENV=development
  EXPOSE 3000
  ENTRYPOINT ["docker-entrypoint.sh"]
  CMD ["pnpm", "start"]
  
  # ---------------------------------------
  # 3. Builder (Compilar el código)
  # ---------------------------------------
  FROM base AS builder
  # Instalamos TODO (dev + prod) para poder compilar
  RUN pnpm install --frozen-lockfile
  COPY . .
  RUN pnpm build
  
  # ---------------------------------------
  # 4. Production (Imagen final ligera)
  # ---------------------------------------
  FROM base AS production
  
  # Instalamos SOLO dependencias de producción (ahorra espacio y memoria)
  RUN pnpm install --prod --frozen-lockfile
  
  # Copiamos la carpeta 'dist' que creamos en la etapa 'builder'
  COPY --from=builder /app/dist ./dist
  
  # Herramientas extra que pediste
  RUN apk add --no-cache postgresql-client bash
  
  # Entrypoint
  COPY docker-entrypoint.sh /usr/local/bin/
  RUN chmod +x /usr/local/bin/docker-entrypoint.sh
  
  ENV NODE_ENV=production
  EXPOSE 3000
  
  ENTRYPOINT ["docker-entrypoint.sh"]
  CMD ["node", "dist/main"]
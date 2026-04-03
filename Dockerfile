# ---------------------------------------
# 1. Base (Setup común)
# ---------------------------------------
  FROM node:20-alpine AS base
  RUN npm install -g pnpm
  WORKDIR /app
  COPY package.json pnpm-lock.yaml ./
  
  # ---------------------------------------
  # 2. Builder (Compilar el código)
  # AQUÍ ESTA LA MAGIA: Instalamos TODO (incluido nest cli)
  # ---------------------------------------
  FROM base AS builder
  RUN pnpm install --frozen-lockfile
  COPY . .
  RUN pnpm build

  # ---------------------------------------
  # 3. Development (con hot reload)
  # ---------------------------------------
  FROM base AS development

  # En desarrollo necesitamos dependencias de dev (Nest CLI, etc.)
  RUN pnpm install --frozen-lockfile

  # Herramientas extra para entrypoint y checks de PostgreSQL
  RUN apk add --no-cache postgresql-client bash

  COPY docker-entrypoint.sh /usr/local/bin/
  RUN chmod +x /usr/local/bin/docker-entrypoint.sh

  ENV NODE_ENV=development
  EXPOSE 3000

  ENTRYPOINT ["docker-entrypoint.sh"]
  CMD ["pnpm", "start"]
  
  # ---------------------------------------
  # 4. Production (Imagen final limpia)
  # ---------------------------------------
  FROM base AS production
  
  # Instalamos SOLO lo necesario para correr (ahorra espacio)
  RUN pnpm install --prod --frozen-lockfile
  
  # Copiamos la carpeta 'dist' compilada desde la etapa anterior
  COPY --from=builder /app/dist ./dist
  
  # Herramientas extra
  RUN apk add --no-cache postgresql-client bash
  
  # Entrypoint
  COPY docker-entrypoint.sh /usr/local/bin/
  RUN chmod +x /usr/local/bin/docker-entrypoint.sh
  
  ENV NODE_ENV=production
  EXPOSE 3000
  
  ENTRYPOINT ["docker-entrypoint.sh"]
  CMD ["node", "dist/main"]
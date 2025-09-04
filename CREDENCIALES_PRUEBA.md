# Credenciales de Prueba para Desarrollo

Este archivo contiene las credenciales predefinidas que se crean automáticamente cuando ejecutas el comando `pnpm seed`.

## 🔐 Usuario Administrador

**Para testing y desarrollo:**

```
Email: admin@dev.com
Contraseña: Admin123!
Rol: Administrador
```

## 🧪 Pruebas en Swagger

1. Navega a: `http://localhost:3000/api`
2. Ve al endpoint `POST /users/login`
3. Usa las credenciales de arriba
4. Copia el `access_token` de la respuesta
5. Haz clic en "Authorize" (🔒) en la parte superior
6. Pega el token con el formato: `Bearer tu_token_aqui`

## 📝 Notas

- ✅ **Estas credenciales se crean automáticamente** con `pnpm seed`
- ✅ **Solo para desarrollo** - no usar en producción
- ✅ **Se puede resetear** ejecutando `pnpm seed` nuevamente
- ⚠️ **Cambiar contraseñas** antes de desplegar a producción

## 🔄 Regenerar datos

```bash
# Recrear base de datos y datos de prueba
pnpm db:setup
pnpm migration:run
pnpm seed
```

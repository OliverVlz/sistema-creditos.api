# Guía de Debugging - Sistema de Notificaciones WebSocket

## Checklist de Verificación

### 1. Backend (NestJS)

#### Verificar que el servidor esté corriendo

```bash
cd sistema-creditos.api
pnpm start
```

**Deberías ver:**

- `Nest application successfully started`
- Puerto: `3000` (o el configurado en .env)

#### Verificar logs de WebSocket

Cuando un cliente se conecte, deberías ver en los logs:

```
Client {socket-id} connected (User: {userId}, Role: {role})
```

Cuando se envíe una notificación:

```
Notification sent to user {userId}: loan:created
Notification sent to admins: loan:created
```

### 2. Frontend (React + Vite)

#### Verificar variables de entorno

Archivo: `sistema-creditos-dashboard.client/.env`

```env
VITE_API_URL=http://localhost:3000/api
```

**IMPORTANTE:** Después de cambiar .env, reiniciar el servidor de Vite.

#### Verificar en Consola del Navegador

**Al cargar la aplicación (sin login):**

```
🔍 NotificationsContext - Estado: { user: undefined, hasToken: false }
⚠️ No hay usuario/token, desconectando socket...
```

**Después de hacer login:**

```
🔍 NotificationsContext - Estado: { user: 'email@example.com', hasToken: true }
🚀 Iniciando conexión WebSocket...
🌐 URL del socket: http://localhost:3000/notifications
🔑 Token: eyJhbGciOiJIUzI1NiIs...
✅ WebSocket CONECTADO exitosamente
Socket ID: abc123xyz
```

**Si hay error de conexión:**

```
❌ Error de conexión WebSocket: {error}
Error details: {mensaje}
```

### 3. Probar el Flujo Completo

#### Escenario 1: Cliente crea solicitud

1. Login como CLIENTE
2. Ir a "Solicitar Crédito"
3. Completar y enviar formulario
4. **Verificar en consola del navegador:**
   - `loan:created` debe aparecer
   - Para el cliente: notificación de confirmación
5. **Verificar en navegador de ADMIN:**
   - Debe aparecer notificación nueva
   - Tabla debe refrescarse automáticamente
   - Log: `🔄 Notificación recibida, refrescando tabla de préstamos...`

#### Escenario 2: Admin aprueba/rechaza

1. Login como ADMIN o ASESOR
2. Ir a "Gestión de Solicitudes"
3. Abrir detalle de una solicitud PENDIENTE
4. Aprobar o rechazar
5. **Verificar en consola:**
   - `loan:approved` o `loan:rejected`
6. **Verificar en navegador del CLIENTE:**
   - Debe aparecer SweetAlert2 con mensaje
   - Si está viendo la tabla, debe refrescarse
   - Si está en el detalle, debe actualizarse

#### Escenario 3: Cliente modifica tras rechazo

1. Login como CLIENTE
2. Ir a solicitud RECHAZADA
3. Modificar documentos
4. **Verificar en consola:**
   - `loan:modified_by_client`
   - Estado debe cambiar a PENDIENTE automáticamente
5. **Verificar en navegador de ADMIN:**
   - Debe aparecer notificación
   - Tabla debe refrescarse

### 4. Problemas Comunes

#### ❌ "WebSocket connection error: Unauthorized"

**Causa:** Token JWT inválido o expirado
**Solución:**

- Cerrar sesión y volver a iniciar
- Verificar que el token se esté guardando en localStorage

#### ❌ "WebSocket connection error: CORS"

**Causa:** CORS mal configurado
**Solución:**

- Verificar `CORS_ORIGINS` en `.env` del backend
- Debe incluir: `http://localhost:5173`
- Reiniciar backend después del cambio

#### ❌ No aparece la campana de notificaciones

**Causa:** NotificationBell no está renderizado
**Solución:**

- Verificar que `Header.tsx` importa `NotificationBell`
- Verificar que no hay errores en consola

#### ❌ Notificaciones no se muestran

**Causa:** AuthContext no tiene token sincronizado
**Solución:**

- Verificar logs: `🔍 NotificationsContext - Estado:`
- Si `hasToken: false`, el problema está en AuthContext
- Verificar que localStorage tiene `token`

#### ❌ Tabla no se refresca automáticamente

**Causa:** Socket no está escuchando eventos
**Solución:**

- Verificar que `socket` no es `null` en useEffect
- Verificar logs de socket.on('loan:xxx')
- Si no hay logs, el socket no está conectado

### 5. Comandos de Debugging

#### Ver logs en tiempo real del backend

```bash
cd sistema-creditos.api
pnpm start | grep -i "notification\|websocket\|client.*connected"
```

#### Inspeccionar WebSocket en Chrome DevTools

1. Abrir DevTools (F12)
2. Ir a pestaña "Network"
3. Filtrar por "WS" (WebSocket)
4. Ver conexiones activas y mensajes

#### Forzar reconexión del WebSocket

En consola del navegador:

```javascript
// Ver estado actual
console.log('Socket:', window.__SOCKET_DEBUG__);

// Forzar desconexión (se reconectará automáticamente)
if (window.__SOCKET_DEBUG__) {
  window.__SOCKET_DEBUG__.disconnect();
}
```

### 6. Testing Manual Rápido

```javascript
// En consola del navegador (después de login)
// 1. Verificar que el socket existe
console.log('Socket conectado:', !!window.io);

// 2. Ver usuario y token
console.log('Usuario:', JSON.parse(localStorage.getItem('user')));
console.log('Token existe:', !!localStorage.getItem('token'));

// 3. Simular notificación (solo para testing)
// Nota: Esto no funcionará en producción, solo sirve para verificar la UI
```

### 7. Checklist Final

- [ ] Backend corriendo en puerto 3000
- [ ] Frontend corriendo en puerto 5173
- [ ] .env del frontend tiene `VITE_API_URL=http://localhost:3000/api`
- [ ] Usuario logueado exitosamente
- [ ] Consola muestra "✅ WebSocket CONECTADO exitosamente"
- [ ] Campana de notificaciones visible en header
- [ ] No hay errores en consola del navegador
- [ ] No hay errores en logs del backend

Si todos los checks están ✅, el sistema debería funcionar correctamente.

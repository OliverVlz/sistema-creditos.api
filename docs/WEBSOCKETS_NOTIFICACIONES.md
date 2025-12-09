# Sistema de Notificaciones en Tiempo Real con WebSockets

## Descripción

Este documento describe la implementación del sistema de notificaciones en tiempo real utilizando WebSockets (Socket.IO) para el sistema de créditos.

## Arquitectura

### Backend (NestJS)

#### 1. Módulo de Notificaciones (`src/notifications/`)

**Archivos creados:**

- `infrastructure/notifications.gateway.ts` - Gateway de WebSocket
- `infrastructure/notifications.service.ts` - Servicio de notificaciones
- `infrastructure/notifications.module.ts` - Módulo de NestJS

**Características:**

- Autenticación mediante JWT en la conexión WebSocket
- Rooms por usuario y por rol (admins)
- Detección de usuarios en línea
- Eventos de ping/pong para mantener la conexión

#### 2. Tipos de Notificaciones

El sistema soporta los siguientes eventos:

- `loan:created` - Cliente crea una solicitud de crédito
- `loan:approved` - Admin/Asesor aprueba un crédito
- `loan:rejected` - Admin/Asesor rechaza un crédito
- `loan:updated` - Actualización genérica del crédito
- `loan:modified_by_client` - Cliente modifica su solicitud tras rechazo

#### 3. Integración en Handlers

Los handlers de préstamos han sido modificados para enviar notificaciones:

**CreateLoanHandler:**

- Envía notificación a admins cuando se crea un préstamo
- Envía confirmación al cliente

**UpdateLoanHandler:**

- Envía notificación según el cambio de estado
- Detecta si es cliente o admin quien actualiza

**CreateLoanWithFilesHandler:**

- Notifica creación con documentos adjuntos

**UpdateLoanWithFilesHandler:**

- Notifica modificaciones de documentos
- Cambia estado a PENDIENTE automáticamente si cliente modifica

### Frontend (React + TypeScript)

#### 1. Context de Notificaciones (`src/context/NotificationsContext.tsx`)

**Características:**

- Conexión automática al WebSocket cuando hay usuario autenticado
- Desconexión automática al cerrar sesión
- Almacenamiento de notificaciones en estado
- Contador de notificaciones no leídas
- Alertas visuales con SweetAlert2

#### 2. Componente NotificationBell (`src/components/common/NotificationBell.tsx`)

**Características:**

- Campana de notificaciones en el header
- Badge con número de notificaciones sin leer
- Dropdown con lista de notificaciones recientes
- Indicador de conexión (conectado/desconectado)
- Navegación a detalle del préstamo
- Formato de tiempo relativo (hace X minutos)

#### 3. Integración

El sistema se integra en:

- `providers/app-providers.tsx` - NotificationsProvider envuelve la aplicación
- `components/header/Header.tsx` - NotificationBell reemplaza el dropdown anterior

## Configuración

### Backend

1. **Variables de Entorno:**

```env
FRONTEND_URL=http://localhost:5173
```

2. **Dependencias instaladas:**

```bash
pnpm add @nestjs/websockets @nestjs/platform-socket.io socket.io
```

3. **Puerto WebSocket:**
   Por defecto usa el mismo puerto que la API (4000)
   Namespace: `/notifications`

### Frontend

1. **Variables de Entorno:**

```env
VITE_API_URL=http://localhost:4000/api
```

2. **Dependencias instaladas:**

```bash
pnpm add socket.io-client
```

3. **Configuración del Socket:**

- URL del socket se deriva de VITE_API_URL
- Autenticación mediante token JWT en el handshake
- Transports: websocket, polling (fallback)
- Reconexión automática activada

## Flujos de Notificación

### 1. Cliente Crea Solicitud de Crédito

```
Cliente crea préstamo
    ↓
CreateLoanHandler ejecuta
    ↓
NotificationsService.notifyLoanCreated()
    ↓
- Notifica a TODOS los admins/asesores (room: 'admins')
- Notifica al cliente confirmación (room: 'user:{clientId}')
```

### 2. Admin/Asesor Aprueba Crédito

```
Admin actualiza estado a APROBADO
    ↓
UpdateLoanHandler ejecuta
    ↓
NotificationsService.notifyLoanApproved()
    ↓
- Notifica al cliente (room: 'user:{clientId}')
- Notifica a admins (room: 'admins')
```

### 3. Admin/Asesor Rechaza Crédito

```
Admin actualiza estado a RECHAZADO
    ↓
UpdateLoanHandler ejecuta
    ↓
NotificationsService.notifyLoanRejected()
    ↓
- Notifica al cliente con razón (room: 'user:{clientId}')
- Notifica a admins (room: 'admins')
```

### 4. Cliente Modifica Solicitud Rechazada

```
Cliente actualiza documentos
    ↓
UpdateLoanWithFilesHandler ejecuta
    ↓
Estado cambia automáticamente a PENDIENTE
    ↓
NotificationsService.notifyLoanModifiedByClient()
    ↓
- Notifica a admins (room: 'admins')
- Confirma al cliente (room: 'user:{clientId}')
```

## Seguridad

1. **Autenticación:** Todas las conexiones WebSocket requieren un JWT válido
2. **Autorización:** Los usuarios solo reciben notificaciones de:
   - Sus propios préstamos (clientes)
   - Todos los préstamos (admins/asesores)
3. **Rooms privados:** Cada usuario tiene un room privado (`user:{userId}`)
4. **Validación de token:** El token se valida en cada conexión

## Testing

### Probar Conexión WebSocket

1. Iniciar backend: `pnpm start`
2. Iniciar frontend: `pnpm dev`
3. Autenticarse en el sistema
4. Verificar en consola del navegador: "WebSocket connected"

### Probar Notificaciones

**Como Cliente:**

1. Crear una nueva solicitud de crédito
2. Verificar que aparece notificación de confirmación
3. Verificar que admins reciben notificación

**Como Admin:**

1. Aprobar/Rechazar un crédito
2. Verificar que el cliente recibe notificación
3. Verificar que otros admins reciben notificación

**Como Cliente (después de rechazo):**

1. Modificar documentos del préstamo rechazado
2. Verificar que estado cambia a PENDIENTE
3. Verificar que admins reciben notificación de modificación

## Mejoras Futuras

1. **Persistencia de Notificaciones:**
   - Guardar notificaciones en base de datos
   - Endpoint para obtener historial completo
   - Marcar notificaciones como leídas

2. **Notificaciones Push:**
   - Integrar con service workers
   - Notificaciones del navegador
   - Notificaciones móviles

3. **Filtros y Preferencias:**
   - Permitir a usuarios configurar qué notificaciones recibir
   - Filtros por tipo de préstamo
   - Silenciar notificaciones temporalmente

4. **Analytics:**
   - Trackear tiempo de respuesta de admins
   - Estadísticas de notificaciones enviadas
   - Tasa de lectura de notificaciones

5. **Escalabilidad:**
   - Implementar Redis Adapter para Socket.IO
   - Soportar múltiples instancias del servidor
   - Queue para notificaciones masivas

## Troubleshooting

### Cliente no se conecta al WebSocket

**Problema:** El cliente no se conecta o se desconecta inmediatamente.

**Soluciones:**

1. Verificar que el token JWT es válido
2. Verificar que CORS está configurado correctamente
3. Revisar que el usuario está autenticado antes de la conexión
4. Verificar en logs del backend: "Client {id} connected"

### Notificaciones no se reciben

**Problema:** Las notificaciones no aparecen en el frontend.

**Soluciones:**

1. Verificar que el usuario está en línea (indicador verde)
2. Revisar consola del navegador por errores de Socket.IO
3. Verificar que el evento está siendo emitido en backend (logs)
4. Confirmar que el usuario tiene permisos para recibir esa notificación

### Error de CORS

**Problema:** Error de CORS en conexión WebSocket.

**Solución:**
Verificar en `notifications.gateway.ts`:

```typescript
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
```

## Referencias

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [NestJS WebSockets](https://docs.nestjs.com/websockets/gateways)
- [React Context API](https://react.dev/reference/react/useContext)

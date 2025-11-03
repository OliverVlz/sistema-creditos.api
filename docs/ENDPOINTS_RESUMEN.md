# 📋 RESUMEN DE ENDPOINTS - SISTEMA DE CRÉDITOS

## 🎯 ENDPOINTS FINALES

### **MÓDULO USERS (Identity)**

```typescript
POST   /users/sign-up         // Público - Autoregistro de clientes
POST   /users/admin/staff     // Admin - Crear staff (Advisor/Admin)
POST   /users/login           // Público - Inicio de sesión
GET    /users/me              // Auth - Info usuario actual
GET    /users/                // Admin/Advisor - Listar usuarios
```

---

### **MÓDULO CLIENTS**

```typescript
POST   /clients/register              // Admin/Advisor - Crear cliente manualmente
GET    /clients/all                   // Admin/Advisor - Lista todos los clientes
GET    /clients/me/profile            // Client - Mi perfil crediticio
GET    /clients/:userId/profile       // Admin/Advisor - Ver perfil de cliente
PATCH  /clients/:id                   // Admin/Advisor - Actualizar info crediticia
DELETE /clients/:id                   // Admin/Advisor - Eliminar perfil crediticio
```

---

## 🔐 PERMISOS POR ENDPOINT

| Endpoint | Público | Client | Advisor | Admin |
|----------|---------|--------|---------|-------|
| `POST /users/sign-up` | ✅ | ✅ | ✅ | ✅ |
| `POST /users/login` | ✅ | ✅ | ✅ | ✅ |
| `GET /users/me` | ❌ | ✅ | ✅ | ✅ |
| `POST /users/admin/staff` | ❌ | ❌ | ❌ | ✅ |
| `GET /users/` | ❌ | ❌ | ✅ | ✅ |
| `POST /clients/register` | ❌ | ❌ | ✅ | ✅ |
| `GET /clients/all` | ❌ | ❌ | ✅ | ✅ |
| `GET /clients/me/profile` | ❌ | ✅ | ❌ | ❌ |
| `GET /clients/:userId/profile` | ❌ | ❌ | ✅ | ✅ |
| `PATCH /clients/:id` | ❌ | ❌ | ✅ | ✅ |
| `DELETE /clients/:id` | ❌ | ❌ | ✅ | ✅ |

---

## 📝 FLUJOS DE CREACIÓN

### **1. Cliente se autoregistra (Web pública)**
```
Cliente → POST /users/sign-up
         ↓
   Crea User + Client
         ↓
   createdBy = mismo usuario
```

### **2. Admin/Advisor crea cliente (Presencial/Teléfono)**
```
Admin/Advisor → POST /clients/register
               ↓
          Crea User + Client
               ↓
          createdBy = Admin/Advisor ✅ TRAZABILIDAD
```

### **3. Admin crea staff (Personal interno)**
```
Admin → POST /users/admin/staff
       ↓
   Crea solo User (sin Client)
       ↓
   role = ADVISOR o ADMIN
```

---

## 🗄️ TRAZABILIDAD EN BASE DE DATOS

```sql
-- Tabla users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE,
  password VARCHAR,
  first_name VARCHAR,
  last_name VARCHAR,
  role VARCHAR,
  created_by UUID REFERENCES users(id),  ← Quién creó el usuario
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Tabla clients
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),
  organization_id UUID REFERENCES organizations(id),
  document_number VARCHAR UNIQUE,
  phone_number VARCHAR,
  address VARCHAR,
  birth_date DATE,
  employment_status VARCHAR,
  is_active BOOLEAN,
  created_by UUID REFERENCES users(id),  ← Quién creó el perfil
  updated_by UUID REFERENCES users(id),  ← Quién lo actualizó
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 📊 CASOS DE USO

| Caso | Endpoint | Trazabilidad |
|------|----------|--------------|
| Cliente se registra desde web | `POST /users/sign-up` | createdBy = mismo usuario |
| Admin crea cliente presencial | `POST /clients/register` | createdBy = ID Admin |
| Advisor crea cliente por teléfono | `POST /clients/register` | createdBy = ID Advisor |
| Admin crea nuevo Advisor | `POST /users/admin/staff` | createdBy = ID Admin |
| Admin crea otro Admin | `POST /users/admin/staff` | createdBy = ID Admin |

---

## ✅ ENDPOINTS ELIMINADOS (No necesarios)

❌ `POST /clients/` - Crear Client para User existente (caso edge eliminado)
❌ `GET /clients/:id` - Obtener Client por ID (redundante)

**Razón:** No hay necesidad de agregar perfil de cliente a usuarios existentes. Todos los clientes se crean completos (User + Client) en un solo paso.

---

## 🎯 ARQUITECTURA IMPLEMENTADA

```
┌──────────────────────────────────────────────────┐
│  PRESENTACIÓN (Controllers)                      │
│  - Valida permisos con Guards                    │
│  - Transforma DTOs                               │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│  APLICACIÓN (Handlers - CQRS)                    │
│  - Orquesta el flujo                             │
│  - Llama a servicios y repositorios              │
└──────────────────────────────────────────────────┘
                    ↓
┌──────────────────────────────────────────────────┐
│  INFRAESTRUCTURA (Repositories)                  │
│  - Maneja transacciones                          │
│  - Persistencia en BD                            │
│  - Queries y validaciones                        │
└──────────────────────────────────────────────────┘
```

**Cumple con Arquitectura Hexagonal ✅**

---

## 📦 DEPENDENCIAS ENTRE MÓDULOS

```
IdentityModule ←→ ClientsModule (forwardRef)
     ↓                  ↓
 UserRepository    ClientRepository
     ↓                  ↓
   users table      clients table
```

**Resolución de dependencia circular:** Usando `forwardRef()` de NestJS

---

## 🚀 VENTAJAS DE LA ARQUITECTURA ACTUAL

1. ✅ **Trazabilidad completa:** Sabes quién creó cada registro
2. ✅ **Separación clara:** Public vs Protected endpoints
3. ✅ **Sin redundancia:** Eliminados endpoints innecesarios
4. ✅ **Flexible:** Fácil de extender con nuevos roles
5. ✅ **Seguro:** Validación de permisos en cada endpoint
6. ✅ **Mantenible:** Arquitectura hexagonal bien implementada


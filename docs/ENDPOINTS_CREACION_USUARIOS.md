# 📋 ENDPOINTS DE CREACIÓN DE USUARIOS Y CLIENTES

## 🎯 FLUJOS DE NEGOCIO

### 1️⃣ AUTOREGISTRO (Cliente se registra solo)

**Endpoint:** `POST /users/sign-up`  
**Autenticación:** Pública (sin token)  
**Descripción:** Un cliente se registra desde la web pública  
**Trazabilidad:** `createdBy` = el mismo usuario creado (auto-referencia)

```typescript
// Request
POST /users/sign-up
{
  "email": "cliente@example.com",
  "password": "Password123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "documentNumber": "12345678",
  "address": "Calle 25 #12 - 27 of 403",
  "birthDate": "1990-01-15",
  "phone": "+573001234567",
  "employmentStatus": "EMPLOYED",
  "organizationId": "org-uuid"
}

// Response
{
  "id": "user-uuid",
  "email": "cliente@example.com",
  "role": "CLIENT",
  "firstName": "Juan",
  "lastName": "Pérez",
  "client": {
    "id": "client-uuid",
    "address": "Calle 25 #12 - 27 of 403",
    "birthDate": "1990-01-15",
    "phoneNumber": "+573001234567",
    "employmentStatus": "EMPLOYED",
    "isActive": true,
    "organization": {
      "id": "org-uuid",
      "name": "Organización XYZ"
    }
  }
}
```

**Resultado:**

- ✅ Crea registro en tabla `users`
- ✅ Crea registro en tabla `clients`
- ✅ Ambos vinculados (relación 1:1)
- ✅ `createdBy` = ID del usuario creado

---

### 2️⃣ REGISTRO ASISTIDO (Admin/Advisor crea cliente)

**Endpoint:** `POST /clients/register`  
**Autenticación:** Requiere token (Admin o Advisor)  
**Descripción:** Un Admin o Advisor registra a un cliente manualmente (teléfono, presencial)  
**Trazabilidad:** `createdBy` = ID del Admin/Advisor que lo creó

```typescript
// Request
POST /clients/register
Authorization: Bearer <token-admin-o-advisor>
{
  "email": "cliente2@example.com",
  "password": "Password123",
  "firstName": "María",
  "lastName": "González",
  "documentNumber": "87654321",
  "address": "Calle 25 #12 - 27 of 403",
  "birthDate": "1985-05-20",
  "phone": "+573009876543",
  "employmentStatus": "SELF_EMPLOYED",
  "organizationId": "org-uuid"
}

// Response
{
  "id": "user-uuid",
  "email": "cliente2@example.com",
  "role": "CLIENT",
  "firstName": "María",
  "lastName": "González",
  "client": {
    "id": "client-uuid",
    "address": "Calle 25 #12 - 27 of 403",
    "birthDate": "1985-05-20",
    "phoneNumber": "+573009876543",
    "employmentStatus": "SELF_EMPLOYED",
    "isActive": true,
    "organization": {
      "id": "org-uuid",
      "name": "Organización XYZ"
    }
  }
}
```

**Resultado:**

- ✅ Crea registro en tabla `users`
- ✅ Crea registro en tabla `clients`
- ✅ Ambos vinculados (relación 1:1)
- ✅ `createdBy` = ID del Admin/Advisor (TRAZABILIDAD)

---

### 3️⃣ CREAR STAFF (Admin crea Advisor u otro Admin)

**Endpoint:** `POST /users/admin/staff`  
**Autenticación:** Requiere token (Solo Admin)  
**Descripción:** Admin crea usuarios de personal interno (Advisor, Admin)  
**Trazabilidad:** `createdBy` = ID del Admin que lo creó

```typescript
// Request
POST /users/admin/staff
Authorization: Bearer <token-admin>
{
  "email": "advisor@example.com",
  "password": "Admin123456!",
  "firstName": "Carlos",
  "lastName": "Ramírez",
  "role": "ADVISOR"
}

// Response
{
  "id": "user-uuid",
  "email": "advisor@example.com",
  "role": "ADVISOR",
  "firstName": "Carlos",
  "lastName": "Ramírez"
}
```

**Resultado:**

- ✅ Crea registro en tabla `users` únicamente
- ❌ NO crea registro en tabla `clients` (porque es staff)
- ✅ Puede tener roles: ADVISOR, ADMIN

---

## 📊 RESUMEN DE ENDPOINTS

| Endpoint                  | Autenticación | Quién lo usa  | Qué crea      | Trazabilidad              |
| ------------------------- | ------------- | ------------- | ------------- | ------------------------- |
| `POST /users/sign-up`     | Público       | Cliente       | User + Client | createdBy = mismo usuario |
| `POST /clients/register`  | Admin/Advisor | Admin/Advisor | User + Client | createdBy = Admin/Advisor |
| `POST /users/admin/staff` | Admin         | Admin         | Solo User     | createdBy = Admin         |

---

## 🔐 PERMISOS

```typescript
// Roles disponibles
enum UserRole {
  CLIENT = 'CLIENT',       // Cliente (solicita préstamos)
  ADVISOR = 'ADVISOR',     // Asesor (gestiona clientes y préstamos)
  ADMIN = 'ADMIN'          // Administrador (acceso total)
}

// Guards aplicados
POST /users/sign-up          → @Public() (sin autenticación)
POST /clients/register       → @UseGuards(AdminOrAdvisorGuard)
POST /users/admin/staff      → @UseGuards(AdminGuard)
```

---

## 📝 ESTADOS DE EMPLEO

```typescript
enum EmploymentStatus {
  EMPLOYED = 'EMPLOYED', // Empleado
  SELF_EMPLOYED = 'SELF_EMPLOYED', // Independiente
  UNEMPLOYED = 'UNEMPLOYED', // Desempleado
  RETIRED = 'RETIRED', // Pensionado
  STUDENT = 'STUDENT', // Estudiante
}
```

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### Tabla `users`

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password VARCHAR NOT NULL,
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),  -- TRAZABILIDAD
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Tabla `clients`

```sql
CREATE TABLE clients (
  id UUID PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),      -- Relación 1:1 con User
  organization_id UUID REFERENCES organizations(id),
  document_number VARCHAR UNIQUE NOT NULL,
  phone_number VARCHAR,
  address VARCHAR NOT NULL,
  birth_date DATE NOT NULL,
  employment_status VARCHAR NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),          -- TRAZABILIDAD
  updated_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 VENTAJAS DE ESTA ARQUITECTURA

### ✅ Trazabilidad Completa

- Sabes quién creó cada cliente
- Diferencias entre autoregistro y registro asistido
- Auditoría completa de operaciones

### ✅ Separación de Responsabilidades

- Endpoint público solo para autoregistro
- Endpoints protegidos para Admin/Advisor
- Roles bien definidos

### ✅ Flexibilidad

- Puedes agregar Client a User existente (casos edge)
- Staff no necesita perfil de cliente
- Fácil de extender con nuevos roles

### ✅ Seguridad

- Endpoints críticos protegidos con Guards
- Validación de permisos a nivel de controlador
- Token JWT requerido para operaciones sensibles

---

## 🧪 EJEMPLOS DE USO

### Cliente se registra desde web pública:

```bash
curl -X POST http://localhost:3000/users/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "cliente@test.com",
    "password": "Pass123",
    "firstName": "Test",
    "lastName": "User",
    "documentNumber": "12345",
    "address": "Calle 25 #12 - 27 of 403",
    "birthDate": "1990-01-01",
    "employmentStatus": "EMPLOYED",
    "organizationId": "org-uuid"
  }'
```

### Admin crea cliente manualmente:

```bash
curl -X POST http://localhost:3000/clients/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token-admin>" \
  -d '{
    "email": "cliente2@test.com",
    "password": "Pass123",
    "firstName": "Cliente",
    "lastName": "Nuevo",
    "documentNumber": "54321",
    "address": "Calle 25 #12 - 27 of 403",
    "birthDate": "1985-05-20",
    "employmentStatus": "SELF_EMPLOYED",
    "organizationId": "org-uuid"
  }'
```

### Admin crea Advisor:

```bash
curl -X POST http://localhost:3000/users/admin/staff \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token-admin>" \
  -d '{
    "email": "advisor@test.com",
    "password": "Admin123456!",
    "firstName": "Carlos",
    "lastName": "Advisor",
    "role": "ADVISOR"
  }'
```

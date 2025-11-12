# Permisos de Actualización - Usuarios y Clientes

## 🎯 Separación de Dominios

### 📂 **Módulo CLIENTS** (`/clients`)
**Dominio**: Información crediticia (préstamos, empleo, organización)

| Endpoint | Rol | Campos Editables |
|----------|-----|------------------|
| `PATCH /clients/me/profile` | CLIENTE | firstName, lastName, address, phoneNumber, birthDate, employmentStatus, organizationId **(7 campos)** |
| `PATCH /clients/:userId` | ADMIN | Los 7 anteriores + email, isActive **(9 campos)** |

**❌ Inmutable**: `documentNumber` (nadie puede cambiar)

---

### 📂 **Módulo USERS** (`/users`)
**Dominio**: Identidad y autenticación (staff, roles, contraseñas)

| Endpoint | Rol | Campos Editables |
|----------|-----|------------------|
| `PATCH /users/me/profile` | ADVISOR | firstName, lastName, phoneNumber **(3 campos)** |
| `PATCH /users/:userId` | ADMIN | firstName, lastName, email, documentNumber, phoneNumber, role, isActive **(7 campos)** |
| `PATCH /users/me/password` | Cualquiera | password (requiere currentPassword) |
| `PATCH /users/:userId/password` | ADMIN | password (sin currentPassword requerido) |

---

## 🔐 Matriz de Permisos

### CLIENTE
- ✅ Edita su perfil crediticio (7 campos)
- ❌ No puede cambiar: email, documentNumber, isActive

### ADVISOR (ASESOR)
- ✅ Edita su perfil básico (3 campos)
- ✅ Cambia su propia contraseña
- ✅ Gestiona clientes (lectura/actualización vía `/clients`)
- ❌ No puede cambiar: su email, documentNumber, role, isActive

### ADMIN
- ✅ **Control total** sobre usuarios y clientes
- ✅ Puede cambiar roles, activar/desactivar cuentas
- ✅ Puede resetear contraseñas sin validación
- ✅ Único que puede editar `documentNumber` de usuarios staff

---

## 📍 Regla de Oro

```
🔑 userId = identificador único en TODOS los endpoints
📦 /clients = dominio CREDITICIO
📦 /users = dominio IDENTIDAD
```

## 🗑️ Eliminado

- ❌ `update-client/` (comando genérico obsoleto)
- ❌ `update-client.dto.ts` (DTO genérico)
- ❌ `update-client-password-admin/` (movido a `/users`)

## ✅ Implementado

- ✅ `update-client-profile/` - Cliente auto-edición
- ✅ `update-client-admin/` - Admin edición completa cliente
- ✅ `update-user-profile/` - Advisor auto-edición
- ✅ `update-user-admin/` - Admin edición completa usuario
- ✅ `update-password/` - Cambio propio de contraseña
- ✅ `update-password-admin/` - Reset admin de contraseña

---

**Fecha**: Noviembre 2025  
**Branch**: `develop`

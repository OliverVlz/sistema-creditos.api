# 📋 Sistema de Créditos - Documentación Técnica Completa

## 🏗️ Arquitectura General

El sistema está construido con **NestJS** siguiendo el patrón **CQRS (Command Query Responsibility Segregation)** y **Domain-Driven Design (DDD)**. Utiliza **TypeORM** como ORM y **PostgreSQL** como base de datos.

### Patrón CQRS Implementado
- **Commands**: Operaciones que modifican el estado (Create, Update, Delete)
- **Queries**: Operaciones de solo lectura (Get, Search, List)
- **Handlers**: Lógica de negocio específica para cada comando/consulta
- **Repositories**: Acceso a datos y persistencia

---

## 🗄️ Modelo de Datos y Entidades

### 1. 👤 **User (users)**
**Propósito**: Gestión de usuarios del sistema (autenticación y autorización)

```typescript
@Entity('users')
export class User {
  id: string;                    // UUID - Clave primaria
  email: string;                 // Email único para login
  password: string;              // Contraseña hasheada
  documentNumber?: string;       // Número de documento (opcional)
  phone?: string;                // Teléfono de contacto
  profile?: {                    // Información personal en JSON
    firstName: string;
    lastName: string;
    address?: object;
    avatarUrl?: string;
  };
  language?: Language;           // Idioma preferido (en/es)
  role: UserRole;               // CLIENT | ADMIN | ADVISOR
  isActive: boolean;            // Estado del usuario
  createdBy?: string;           // Auditoría - quien creó el usuario
  createdAt: Date;              // Fecha de creación
  updatedAt: Date;              // Fecha de última actualización
}
```

**Relaciones**:
- `createdBy` → `User` (self-reference para auditoría)
- `1:N` con `Client` (un usuario puede ser un cliente)
- `1:N` con `Organization` (creador de organizaciones)
- `1:N` con `DocumentType` (creador de tipos de documento)

---

### 2. 🏢 **Organization (organizations)**
**Propósito**: Entidades que otorgan préstamos (Policía, Ejército, etc.)

```typescript
@Entity('organizations')
export class Organization {
  id: string;                   // UUID - Clave primaria
  name: string;                 // Nombre de la organización
  baseInterestRate: number;     // Tasa de interés base (decimal 5,2)
  discountRate: number;         // Tasa de descuento (decimal 5,2)
  taxRate: number;              // Tasa de impuestos (decimal 5,2)
  createdBy: string;            // Auditoría - quien creó la organización
  updatedBy?: string;           // Auditoría - quien actualizó
  isActive: boolean;            // Estado de la organización
  createdAt: Date;              // Fecha de creación
  updatedAt: Date;              // Fecha de última actualización
}
```

**Relaciones**:
- `createdBy` → `User` (creador)
- `updatedBy` → `User` (actualizador)
- `1:N` con `Client` (una organización tiene muchos clientes)
- `1:N` con `Loan` (una organización otorga muchos préstamos)

---

### 3. 👥 **Client (clients)**
**Propósito**: Representa a un usuario como cliente de una organización específica

```typescript
@Entity('clients')
export class Client {
  id: string;                   // UUID - Clave primaria
  userId: string;               // FK → User (único)
  organizationId: string;       // FK → Organization
  employmentStatus: EmploymentStatus; // ACTIVE | RETIRED | RESERVE | INACTIVE | OTHER
  createdBy: string;            // Auditoría - quien creó el cliente
  updatedBy?: string;           // Auditoría - quien actualizó
  isActive: boolean;            // Estado del cliente
  createdAt: Date;              // Fecha de creación
  updatedAt: Date;              // Fecha de última actualización
}
```

**Relaciones**:
- `userId` → `User` (relación 1:1)
- `organizationId` → `Organization` (relación N:1)
- `createdBy` → `User` (creador)
- `updatedBy` → `User` (actualizador)
- `1:N` con `Loan` (un cliente puede tener muchos préstamos)
- `1:N` con `ClientDocument` (un cliente puede subir muchos documentos)

---

### 4. 💰 **LoanType (loan_types)**
**Propósito**: Tipos de préstamos disponibles (Personal, Hipotecario, etc.)

```typescript
@Entity('loan_types')
export class LoanType {
  id: string;                   // UUID - Clave primaria
  name: string;                 // Nombre único del tipo
  description?: string;         // Descripción del tipo
  baseProcessingFee: number;    // Comisión base (decimal 5,2)
  maxAmount: number;            // Monto máximo (decimal 10,2)
  minAmount: number;            // Monto mínimo (decimal 10,2)
  maxTermMonths: number;        // Plazo máximo en meses
  isActive: boolean;            // Estado del tipo
  requiredDocumentTypes: string[]; // IDs de tipos de documento requeridos (JSONB)
  createdAt: Date;              // Fecha de creación
  updatedAt: Date;              // Fecha de última actualización
}
```

**Relaciones**:
- `1:N` con `Loan` (un tipo puede tener muchos préstamos)
- `1:N` con `LoanTypeDocumentRequirement` (configuración de documentos)

---

### 5. 📄 **DocumentType (document_types)**
**Propósito**: Catálogo de tipos de documentos del sistema

```typescript
@Entity('document_types')
export class DocumentType {
  id: string;                   // UUID - Clave primaria
  code: string;                 // Código único (ej: 'CEDULA', 'CERTIFICADO_AVALUO')
  name: string;                 // Nombre descriptivo
  description?: string;         // Descripción detallada
  mimeTypes: string[];          // Tipos MIME permitidos (JSONB)
  maxFileSize: number;          // Tamaño máximo en bytes
  validationRules?: object;     // Reglas de validación (JSONB)
  isActive: boolean;            // Estado del tipo
  displayOrder: number;         // Orden de visualización
  createdBy?: string;           // Auditoría - quien creó el tipo
  createdAt: Date;              // Fecha de creación
  updatedAt: Date;              // Fecha de última actualización
}
```

**Relaciones**:
- `createdBy` → `User` (creador)
- `1:N` con `ClientDocument` (un tipo puede tener muchos documentos subidos)
- `1:N` con `LoanTypeDocumentRequirement` (configuración de requisitos)

---

### 6. 🔗 **LoanTypeDocumentRequirement (loan_type_document_requirements)**
**Propósito**: Tabla intermedia que configura qué documentos requiere cada tipo de préstamo según organización y estado laboral

```typescript
@Entity('loan_type_document_requirements')
@Unique(['loanTypeId', 'documentTypeId', 'organizationId', 'employmentStatus'])
export class LoanTypeDocumentRequirement {
  id: string;                   // UUID - Clave primaria
  loanTypeId: string;           // FK → LoanType
  documentTypeId: string;       // FK → DocumentType
  organizationId?: string;      // FK → Organization (opcional, aplica para todas si es null)
  employmentStatus?: EmploymentStatus; // ACTIVE | RETIRED | RESERVE | INACTIVE | OTHER | ALL
  isMandatory: boolean;         // Si el documento es obligatorio
  validationRules?: object;     // Reglas específicas (JSONB)
  displayOrder: number;         // Orden de visualización
  createdAt: Date;              // Fecha de creación
}
```

**Relaciones**:
- `loanTypeId` → `LoanType` (N:1)
- `documentTypeId` → `DocumentType` (N:1)

---

### 7. 💳 **Loan (loans)**
**Propósito**: Préstamos individuales otorgados a clientes

```typescript
@Entity('loans')
export class Loan {
  id: string;                   // UUID - Clave primaria
  loanNumber: string;           // Número único del préstamo
  clientId: string;             // FK → Client
  loanTypeId: string;           // FK → LoanType
  organizationId: string;       // FK → Organization
  amountRequested: number;      // Monto solicitado (decimal 10,2)
  termMonths: number;           // Plazo en meses
  monthlyPayment: number;       // Pago mensual (decimal 10,2)
  totalAmount: number;          // Monto total a pagar (decimal 10,2)
  interestRate: number;         // Tasa de interés (decimal 5,2)
  processingFee: number;        // Comisión de procesamiento (decimal 10,2)
  status: LoanStatus;           // PENDING | APPROVED | ACTIVE | COMPLETED | DEFAULTED | CANCELLED
  rejectionReason?: string;     // Razón de rechazo (si aplica)
  createdBy: string;            // Auditoría - quien creó el préstamo
  updatedBy?: string;           // Auditoría - quien actualizó
  approvedBy?: string;          // Auditoría - quien aprobó
  approvedAt?: Date;            // Fecha de aprobación
  signedAt?: Date;              // Fecha de firma
  disbursedAt?: Date;           // Fecha de desembolso
  createdAt: Date;              // Fecha de creación
  updatedAt: Date;              // Fecha de última actualización
  deletedAt?: Date;             // Soft delete
}
```

**Relaciones**:
- `clientId` → `Client` (N:1)
- `loanTypeId` → `LoanType` (N:1)
- `organizationId` → `Organization` (N:1)
- `createdBy` → `User` (creador)
- `updatedBy` → `User` (actualizador)
- `approvedBy` → `User` (aprobador)

---

### 8. 📎 **ClientDocument (client_documents)**
**Propósito**: Documentos subidos por los clientes

```typescript
@Entity('client_documents')
@Unique(['client', 'documentType', 'version'])
export class ClientDocument {
  id: string;                   // UUID - Clave primaria
  clientId: string;             // FK → Client
  documentType: DocumentType;   // Enum legacy (cedula_anverso, etc.)
  documentTypeId?: string;      // FK → DocumentType (nuevo sistema)
  fileUrl: string;              // URL del archivo
  fileName: string;             // Nombre del archivo
  fileSize: number;             // Tamaño en bytes
  mimeType: string;             // Tipo MIME del archivo
  isVerified: boolean;          // Si está verificado
  verifiedById?: string;        // FK → User (quien verificó)
  verifiedAt?: Date;            // Fecha de verificación
  verificationNotes?: string;   // Notas de verificación
  uploadIp?: string;            // IP de subida
  uploadUserAgent?: string;     // User agent de subida
  version: number;              // Versión del documento
  replacesDocumentId?: string;  // FK → UserDocument (documento que reemplaza)
  createdAt: Date;              // Fecha de creación
  updatedAt: Date;              // Fecha de última actualización
}
```

**Relaciones**:
- `clientId` → `Client` (N:1)
- `documentTypeId` → `DocumentType` (N:1, opcional)
- `verifiedById` → `User` (N:1, opcional)
- `replacesDocumentId` → `UserDocument` (self-reference)

---

## 🔄 Flujos de Negocio Principales

### 1. **Registro de Usuario y Cliente**
```
1. Usuario se registra → User creado
2. Admin asigna a organización → Client creado
3. Cliente puede subir documentos → UserDocument creado
```

### 2. **Solicitud de Préstamo**
```
1. Cliente solicita préstamo → Loan creado (status: PENDING)
2. Sistema valida documentos requeridos según:
   - Tipo de préstamo (LoanType)
   - Organización del cliente
   - Estado laboral del cliente (employmentStatus)
3. Admin/Advisor revisa y aprueba → Loan actualizado (status: APPROVED)
4. Cliente firma → Loan actualizado (signedAt)
5. Se desembolsa → Loan actualizado (status: ACTIVE, disbursedAt)
```

### 3. **Configuración de Documentos Requeridos**
```
1. Admin crea tipos de documento → DocumentType creado
2. Admin configura requisitos por tipo de préstamo → LoanTypeDocumentRequirement creado
3. Sistema filtra automáticamente según perfil del cliente
```

---

## 🎯 Casos de Uso Específicos

### **Caso: Policía Activo solicita Préstamo por Libranza**

1. **Configuración Inicial**:
```sql
-- Crear tipos de documento
INSERT INTO document_types VALUES
('cedula-uuid', 'CEDULA', 'Cédula de Identidad', ...),
('nomina-uuid', 'COMPROBANTE_NOMINA', 'Comprobante de Nómina', ...),
('autorizacion-uuid', 'AUTORIZACION_DESCUENTO', 'Autorización de Descuento', ...);

-- Configurar requisitos para Préstamo Libranza + Policía + Activo
INSERT INTO loan_type_document_requirements VALUES
('req1', 'libranza-uuid', 'cedula-uuid', 'policia-uuid', 'ACTIVE', true, 1),
('req2', 'libranza-uuid', 'nomina-uuid', 'policia-uuid', 'ACTIVE', true, 2),
('req3', 'libranza-uuid', 'autorizacion-uuid', 'policia-uuid', 'ACTIVE', true, 3);
```

2. **Consulta de Documentos Requeridos**:
```typescript
GET /document-types/required/libranza-uuid/cliente-policia-activo-uuid

// Respuesta automática:
[
  {
    documentTypeId: "cedula-uuid",
    documentCode: "CEDULA",
    documentName: "Cédula de Identidad",
    isMandatory: true,
    displayOrder: 1
  },
  {
    documentTypeId: "nomina-uuid",
    documentCode: "COMPROBANTE_NOMINA", 
    documentName: "Comprobante de Nómina",
    isMandatory: true,
    displayOrder: 2
  },
  {
    documentTypeId: "autorizacion-uuid",
    documentCode: "AUTORIZACION_DESCUENTO",
    documentName: "Autorización de Descuento", 
    isMandatory: true,
    displayOrder: 3
  }
]
```

---

## 🔐 Seguridad y Roles

### **Roles de Usuario**:
- **CLIENT**: Puede solicitar préstamos y subir documentos
- **ADVISOR**: Puede revisar y aprobar préstamos
- **ADMIN**: Gestión completa del sistema

### **Guards Implementados**:
- `JwtAuthGuard`: Autenticación JWT
- `AdminGuard`: Solo administradores
- `AdvisorGuard`: Solo asesores y administradores
- `ClientGuard`: Solo clientes

---

## 📊 Estados y Enums

### **EmploymentStatus**:
- `ACTIVE`: Empleado activo
- `RETIRED`: Pensionado
- `RESERVE`: En reserva
- `INACTIVE`: Inactivo
- `OTHER`: Otro estado
- `ALL`: Aplica para todos los estados

### **LoanStatus**:
- `PENDING`: Pendiente de revisión
- `APPROVED`: Aprobado
- `ACTIVE`: Activo (desembolsado)
- `COMPLETED`: Completado
- `DEFAULTED`: En mora
- `CANCELLED`: Cancelado

---

## 🚀 Endpoints Principales

### **Document Types**:
- `GET /document-types/required/{loanTypeId}/{clientId}` - **NUEVO**: Documentos requeridos por cliente
- `POST /document-types` - Crear tipo de documento
- `GET /document-types` - Listar tipos de documento
- `GET /document-types/:id` - Obtener tipo de documento
- `PATCH /document-types/:id` - Actualizar tipo de documento
- `DELETE /document-types/:id` - Eliminar tipo de documento

### **Loans**:
- `POST /loans` - Crear préstamo
- `GET /loans` - Listar préstamos
- `GET /loans/:id` - Obtener préstamo
- `PATCH /loans/:id` - Actualizar préstamo
- `DELETE /loans/:id` - Eliminar préstamo

### **Clients**:
- `POST /clients` - Crear cliente
- `GET /clients` - Listar clientes
- `GET /clients/:id` - Obtener cliente
- `PATCH /clients/:id` - Actualizar cliente
- `DELETE /clients/:id` - Eliminar cliente

---

## 📁 Módulos del Sistema

### **Client Documents Module** (`src/client-documents/`)
- **Propósito**: Gestiona documentos subidos por clientes
- **Entidad Principal**: `ClientDocument`
- **Relaciones**: 
  - `Client` (N:1) - Cliente que subió el documento
  - `DocumentType` (N:1) - Tipo de documento
  - `Loan` (N:1) - Préstamo asociado (opcional)
- **Endpoints**:
  - `POST /client-documents/upload` - Subir documento
  - `GET /client-documents` - Listar documentos del cliente
  - `GET /client-documents/:id` - Obtener documento específico
  - `PATCH /client-documents/:id/verify` - Verificar documento (ADMIN)

### **Document Type Module** (`src/document-type/`)
- **Propósito**: Gestiona tipos de documento y requisitos por préstamo
- **Entidades Principales**: 
  - `DocumentType` - Tipos de documento disponibles
  - `LoanTypeDocumentRequirement` - Requisitos por tipo de préstamo
- **Endpoints**:
  - `GET /document-types` - Listar tipos de documento
  - `POST /document-types` - Crear tipo de documento (ADMIN)
  - `GET /document-types/required/{loanTypeId}/{clientId}` - Documentos requeridos
  - `GET /document-types/requirements/{loanTypeId}` - Configuración de requisitos (ADMIN)
  - `POST /document-types/requirements` - Agregar requisito (ADMIN)

---

## 🎨 Ventajas del Diseño

1. **Flexibilidad**: Los requisitos de documentos se configuran dinámicamente
2. **Escalabilidad**: Fácil agregar nuevas organizaciones y tipos de préstamo
3. **Auditoría**: Trazabilidad completa de todas las operaciones
4. **Seguridad**: Control granular de acceso por roles
5. **Mantenibilidad**: Código organizado con CQRS y DDD
6. **Configurabilidad**: Reglas de negocio configurables sin código

---

## 🔧 Configuración de Ejemplo

### **Policía Activo vs Pensionado**:

```sql
-- Documentos para TODOS los policías
INSERT INTO loan_type_document_requirements VALUES
('req1', 'libranza-uuid', 'cedula-uuid', 'policia-uuid', 'ALL', true, 1);

-- Solo policías ACTIVOS
INSERT INTO loan_type_document_requirements VALUES
('req2', 'libranza-uuid', 'nomina-uuid', 'policia-uuid', 'ACTIVE', true, 2),
('req3', 'libranza-uuid', 'autorizacion-uuid', 'policia-uuid', 'ACTIVE', true, 3);

-- Solo policías PENSIONADOS
INSERT INTO loan_type_document_requirements VALUES
('req4', 'libranza-uuid', 'pension-uuid', 'policia-uuid', 'RETIRED', true, 2),
('req5', 'libranza-uuid', 'supervivencia-uuid', 'policia-uuid', 'RETIRED', false, 3);
```

Este diseño permite que el sistema sea completamente dinámico y escalable, adaptándose a las necesidades específicas de cada organización y tipo de préstamo.

# 🔧 Configuración de Documentos Requeridos - Panel Admin

## 📋 **Resumen**

Como administrador, puedes configurar qué documentos son requeridos para cada tipo de préstamo, organizados por organización y estado de empleo.

---

## 🎯 **Endpoints para Configuración**

### **1. Ver configuración actual de un tipo de préstamo**
```http
GET /document-types/requirements/{loanTypeId}
Authorization: Bearer admin_jwt_token
```

**Ejemplo para Libranza:**
```http
GET /document-types/requirements/libranza-uuid
```

**Respuesta:**
```json
[
  {
    "id": "req-1-uuid",
    "documentType": {
      "id": "cedula-uuid",
      "code": "CEDULA",
      "name": "Cédula de Ciudadanía",
      "description": "Documento de identificación"
    },
    "organization": {
      "id": "policia-uuid",
      "name": "Policía Nacional",
      "code": "POLICIA"
    },
    "employmentStatus": "ACTIVE",
    "isMandatory": true,
    "displayOrder": 1,
    "validationRules": {
      "minFileSize": 1000000,
      "maxFileSize": 10485760
    },
    "createdAt": "2024-01-15T10:00:00Z"
  },
  {
    "id": "req-2-uuid",
    "documentType": {
      "id": "comprobante-nomina-uuid",
      "code": "COMPROBANTE_NOMINA",
      "name": "Comprobante de Nómina",
      "description": "Últimos 3 comprobantes de nómina"
    },
    "organization": {
      "id": "policia-uuid",
      "name": "Policía Nacional",
      "code": "POLICIA"
    },
    "employmentStatus": "ACTIVE",
    "isMandatory": true,
    "displayOrder": 2,
    "validationRules": null,
    "createdAt": "2024-01-15T10:00:00Z"
  },
  {
    "id": "req-3-uuid",
    "documentType": {
      "id": "comprobante-pension-uuid",
      "code": "COMPROBANTE_PENSION",
      "name": "Comprobante de Pensión",
      "description": "Comprobante de pensión vigente"
    },
    "organization": {
      "id": "policia-uuid",
      "name": "Policía Nacional",
      "code": "POLICIA"
    },
    "employmentStatus": "RETIRED",
    "isMandatory": true,
    "displayOrder": 1,
    "validationRules": null,
    "createdAt": "2024-01-15T10:00:00Z"
  }
]
```

### **2. Agregar nuevo requisito de documento**
```http
POST /document-types/requirements
Authorization: Bearer admin_jwt_token
Content-Type: application/json

{
  "loanTypeId": "libranza-uuid",
  "documentTypeId": "certificado-laboral-uuid",
  "organizationId": "policia-uuid",
  "employmentStatus": "ACTIVE",
  "isMandatory": true,
  "displayOrder": 3,
  "validationRules": {
    "minFileSize": 500000,
    "maxFileSize": 10485760,
    "allowedFormats": ["application/pdf"]
  }
}
```

**Respuesta:**
```json
{
  "requirementId": "new-req-uuid",
  "message": "Document requirement created successfully"
}
```

### **3. Agregar requisito para TODAS las organizaciones**
```http
POST /document-types/requirements
Authorization: Bearer admin_jwt_token
Content-Type: application/json

{
  "loanTypeId": "libranza-uuid",
  "documentTypeId": "cedula-uuid",
  "isMandatory": true,
  "displayOrder": 1,
  "validationRules": {
    "minFileSize": 1000000,
    "maxFileSize": 10485760
  }
}
```

**Nota:** Sin `organizationId` y `employmentStatus` = aplica para TODOS

---

## 🏢 **Ejemplos de Configuración por Organización**

### **Policía Nacional - Activos**
```json
[
  {
    "documentTypeId": "cedula-uuid",
    "organizationId": "policia-uuid",
    "employmentStatus": "ACTIVE",
    "isMandatory": true,
    "displayOrder": 1
  },
  {
    "documentTypeId": "comprobante-nomina-uuid",
    "organizationId": "policia-uuid",
    "employmentStatus": "ACTIVE",
    "isMandatory": true,
    "displayOrder": 2
  },
  {
    "documentTypeId": "certificado-laboral-uuid",
    "organizationId": "policia-uuid",
    "employmentStatus": "ACTIVE",
    "isMandatory": true,
    "displayOrder": 3
  },
  {
    "documentTypeId": "autorizacion-descuento-uuid",
    "organizationId": "policia-uuid",
    "employmentStatus": "ACTIVE",
    "isMandatory": true,
    "displayOrder": 4
  }
]
```

### **Policía Nacional - Pensionados**
```json
[
  {
    "documentTypeId": "cedula-uuid",
    "organizationId": "policia-uuid",
    "employmentStatus": "RETIRED",
    "isMandatory": true,
    "displayOrder": 1
  },
  {
    "documentTypeId": "comprobante-pension-uuid",
    "organizationId": "policia-uuid",
    "employmentStatus": "RETIRED",
    "isMandatory": true,
    "displayOrder": 2
  },
  {
    "documentTypeId": "constancia-pension-uuid",
    "organizationId": "policia-uuid",
    "employmentStatus": "RETIRED",
    "isMandatory": true,
    "displayOrder": 3
  },
  {
    "documentTypeId": "certificado-supervivencia-uuid",
    "organizationId": "policia-uuid",
    "employmentStatus": "RETIRED",
    "isMandatory": false,
    "displayOrder": 4
  }
]
```

### **Ejército - Activos**
```json
[
  {
    "documentTypeId": "cedula-uuid",
    "organizationId": "ejercito-uuid",
    "employmentStatus": "ACTIVE",
    "isMandatory": true,
    "displayOrder": 1
  },
  {
    "documentTypeId": "comprobante-nomina-uuid",
    "organizationId": "ejercito-uuid",
    "employmentStatus": "ACTIVE",
    "isMandatory": true,
    "displayOrder": 2
  },
  {
    "documentTypeId": "certificado-militar-uuid",
    "organizationId": "ejercito-uuid",
    "employmentStatus": "ACTIVE",
    "isMandatory": true,
    "displayOrder": 3
  }
]
```

---

## 🎯 **Flujo de Configuración en el Panel Admin**

### **Paso 1: Acceder a Configuración de Préstamos**
```
Admin Panel → Loan Types → Libranza → Document Requirements
```

### **Paso 2: Ver configuración actual**
```http
GET /loan-types/libranza-uuid/document-requirements
```

### **Paso 3: Agregar requisitos por organización**
```http
POST /loan-types/libranza-uuid/document-requirements
{
  "documentTypeId": "cedula-uuid",
  "organizationId": "policia-uuid",
  "employmentStatus": "ACTIVE",
  "isMandatory": true,
  "displayOrder": 1
}
```

### **Paso 4: Verificar configuración**
```http
GET /loan-types/libranza-uuid/document-requirements
```

---

## 📊 **Estados de Empleo Soportados**

- `ACTIVE` → Empleado activo
- `RETIRED` → Pensionado
- `RESERVE` → En reserva
- `INACTIVE` → Inactivo
- `OTHER` → Otro estado
- `ALL` → Aplica para todos los estados

---

## 🔧 **Reglas de Validación Personalizadas**

```json
{
  "validationRules": {
    "minFileSize": 1000000,        // 1MB mínimo
    "maxFileSize": 10485760,       // 10MB máximo
    "allowedFormats": ["application/pdf", "image/jpeg"],
    "maxPages": 5,                 // Máximo 5 páginas
    "requiredFields": ["fecha_emision", "valor"],
    "expirationDays": 30           // Válido por 30 días
  }
}
```

---

## ⚠️ **Consideraciones Importantes**

1. **Unicidad**: No puede haber duplicados para la misma combinación de `loanTypeId`, `organizationId`, `employmentStatus`
2. **Orden**: `displayOrder` determina el orden de visualización
3. **Obligatoriedad**: `isMandatory` determina si el documento es obligatorio
4. **Validación**: `validationRules` se aplican al subir el documento
5. **Auditoría**: Se registra quién creó cada requisito

---

## 🎯 **Ejemplo de Uso Completo**

```typescript
// 1. Admin ve configuración actual
const currentConfig = await fetch('/loan-types/libranza-uuid/document-requirements', {
  headers: { Authorization: `Bearer ${adminToken}` }
});

// 2. Admin agrega requisito para policía activa
await fetch('/loan-types/libranza-uuid/document-requirements', {
  method: 'POST',
  headers: { 
    Authorization: `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    documentTypeId: 'cedula-uuid',
    organizationId: 'policia-uuid',
    employmentStatus: 'ACTIVE',
    isMandatory: true,
    displayOrder: 1
  })
});

// 3. Admin agrega requisito para policía pensionada
await fetch('/loan-types/libranza-uuid/document-requirements', {
  method: 'POST',
  headers: { 
    Authorization: `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    documentTypeId: 'comprobante-pension-uuid',
    organizationId: 'policia-uuid',
    employmentStatus: 'RETIRED',
    isMandatory: true,
    displayOrder: 1
  })
});

// 4. Admin verifica configuración final
const finalConfig = await fetch('/loan-types/libranza-uuid/document-requirements', {
  headers: { Authorization: `Bearer ${adminToken}` }
});
```

Con esta configuración, el sistema automáticamente determinará qué documentos necesita cada cliente según su organización y estado de empleo.

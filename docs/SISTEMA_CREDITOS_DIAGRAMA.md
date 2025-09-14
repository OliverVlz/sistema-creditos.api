# 🏗️ Diagrama de Relaciones del Sistema de Créditos

## 📊 Diagrama ER (Entity Relationship)

```mermaid
erDiagram
    users {
        uuid id PK
        string email UK
        string password
        string document_number UK
        string phone
        json profile
        enum language
        enum role
        boolean is_active
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    organizations {
        uuid id PK
        string name
        decimal base_interest_rate
        decimal discount_rate
        decimal tax_rate
        uuid created_by FK
        uuid updated_by FK
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    clients {
        uuid id PK
        uuid user_id FK
        uuid organization_id FK
        enum employment_status
        uuid created_by FK
        uuid updated_by FK
        boolean is_active
        timestamp created_at
        timestamp updated_at
    }
    
    loan_types {
        uuid id PK
        string name UK
        string description
        decimal base_processing_fee
        decimal max_amount
        decimal min_amount
        integer max_term_months
        boolean is_active
        json required_document_types
        timestamp created_at
        timestamp updated_at
    }
    
    document_types {
        uuid id PK
        string code UK
        string name
        text description
        json mime_types
        integer max_file_size
        json validation_rules
        boolean is_active
        integer display_order
        uuid created_by FK
        timestamp created_at
        timestamp updated_at
    }
    
    loan_type_document_requirements {
        uuid id PK
        uuid loan_type_id FK
        uuid document_type_id FK
        uuid organization_id FK
        enum employment_status
        boolean is_mandatory
        json validation_rules
        integer display_order
        timestamp created_at
    }
    
    loans {
        uuid id PK
        string loan_number UK
        uuid client_id FK
        uuid loan_type_id FK
        uuid organization_id FK
        decimal amount_requested
        integer term_months
        decimal monthly_payment
        decimal total_amount
        decimal interest_rate
        decimal processing_fee
        enum status
        string rejection_reason
        uuid created_by FK
        uuid updated_by FK
        uuid approved_by FK
        timestamp approved_at
        date signed_at
        date disbursed_at
        timestamp created_at
        timestamp updated_at
        timestamp deleted_at
    }
    
    client_documents {
        uuid id PK
        uuid client_id FK
        enum document_type
        uuid document_type_id FK
        string file_url
        string file_name
        integer file_size
        string mime_type
        boolean is_verified
        uuid verified_by FK
        timestamp verified_at
        text verification_notes
        string upload_ip
        text upload_user_agent
        integer version
        uuid replaces_document_id FK
        timestamp created_at
        timestamp updated_at
    }

    %% Relaciones principales
    users ||--o{ clients : "1:1"
    users ||--o{ organizations : "crea"
    users ||--o{ document_types : "crea"
    users ||--o{ loans : "crea/aprueba"
    users ||--o{ client_documents : "verifica"
    
    organizations ||--o{ clients : "1:N"
    organizations ||--o{ loans : "1:N"
    
    clients ||--o{ loans : "1:N"
    clients ||--o{ client_documents : "1:N"
    
    loan_types ||--o{ loans : "1:N"
    loan_types ||--o{ loan_type_document_requirements : "1:N"
    
    document_types ||--o{ client_documents : "1:N"
    document_types ||--o{ loan_type_document_requirements : "1:N"
    
    %% Relaciones de auditoría
    users ||--o{ users : "created_by"
    users ||--o{ organizations : "created_by/updated_by"
    users ||--o{ clients : "created_by/updated_by"
    users ||--o{ loans : "created_by/updated_by/approved_by"
    users ||--o{ document_types : "created_by"
    users ||--o{ client_documents : "verified_by"
```

## 🔄 Flujo de Datos Principal

```mermaid
flowchart TD
    A[Usuario se Registra] --> B[Admin asigna a Organización]
    B --> C[Cliente creado]
    C --> D[Cliente solicita Préstamo]
    D --> E[Sistema valida Documentos Requeridos]
    E --> F{Documentos Completos?}
    F -->|No| G[Cliente sube Documentos Faltantes]
    G --> E
    F -->|Sí| H[Admin/Advisor revisa Solicitud]
    H --> I{¿Aprobado?}
    I -->|No| J[Préstamo Rechazado]
    I -->|Sí| K[Préstamo Aprobado]
    K --> L[Cliente firma Contrato]
    L --> M[Desembolso del Préstamo]
    M --> N[Préstamo Activo]
```

## 🎯 Caso de Uso: Policía Activo

```mermaid
sequenceDiagram
    participant C as Cliente Policía
    participant S as Sistema
    participant A as Admin
    participant DB as Base de Datos
    
    C->>S: Solicita préstamo por libranza
    S->>DB: Consulta documentos requeridos
    Note over DB: Filtra por:<br/>- loan_type_id = 'libranza'<br/>- organization_id = 'policia'<br/>- employment_status = 'ACTIVE'
    DB-->>S: Retorna documentos específicos
    S-->>C: Muestra: Cédula, Nómina, Autorización
    
    C->>S: Sube documentos requeridos
    S->>DB: Guarda UserDocument
    
    A->>S: Revisa solicitud
    A->>S: Aprueba préstamo
    S->>DB: Actualiza Loan (status: APPROVED)
    
    C->>S: Firma contrato
    S->>DB: Actualiza Loan (signedAt)
    
    A->>S: Desembolsa préstamo
    S->>DB: Actualiza Loan (status: ACTIVE, disbursedAt)
```

## 📋 Estados del Sistema

### Estados de Préstamo
```mermaid
stateDiagram-v2
    [*] --> PENDING : Solicitud creada
    PENDING --> APPROVED : Admin aprueba
    PENDING --> CANCELLED : Admin rechaza
    APPROVED --> ACTIVE : Cliente firma y se desembolsa
    ACTIVE --> COMPLETED : Préstamo pagado completamente
    ACTIVE --> DEFAULTED : Cliente no paga
    CANCELLED --> [*]
    COMPLETED --> [*]
    DEFAULTED --> [*]
```

### Estados de Empleo
```mermaid
stateDiagram-v2
    [*] --> ACTIVE : Empleado activo
    ACTIVE --> RETIRED : Se pensiona
    ACTIVE --> INACTIVE : Se retira temporalmente
    ACTIVE --> RESERVE : Pasa a reserva
    INACTIVE --> ACTIVE : Regresa al trabajo
    RESERVE --> ACTIVE : Regresa al servicio activo
    RETIRED --> [*]
```

## 🔐 Matriz de Permisos

| Rol | Crear Usuario | Crear Cliente | Crear Préstamo | Aprobar Préstamo | Gestionar Documentos |
|-----|---------------|---------------|----------------|------------------|---------------------|
| CLIENT | ❌ | ❌ | ✅ | ❌ | ✅ (subir) |
| ADVISOR | ❌ | ✅ | ✅ | ✅ | ✅ (verificar) |
| ADMIN | ✅ | ✅ | ✅ | ✅ | ✅ (todo) |

## 🎨 Arquitectura de Módulos

```mermaid
graph TB
    subgraph "Presentation Layer"
        UC[Users Controller]
        CC[Clients Controller]
        LC[Loans Controller]
        DC[Document Types Controller]
        OC[Organizations Controller]
    end
    
    subgraph "Application Layer (CQRS)"
        CH[Command Handlers]
        QH[Query Handlers]
        C[Commands]
        Q[Queries]
    end
    
    subgraph "Domain Layer"
        E[Entities]
        EN[Enums]
        V[Value Objects]
    end
    
    subgraph "Infrastructure Layer"
        R[Repositories]
        DB[(PostgreSQL)]
        FS[File Storage]
    end
    
    UC --> CH
    CC --> CH
    LC --> CH
    DC --> CH
    OC --> CH
    
    UC --> QH
    CC --> QH
    LC --> QH
    DC --> QH
    OC --> QH
    
    CH --> R
    QH --> R
    R --> DB
    R --> FS
    
    CH --> E
    QH --> E
    E --> EN
```

Esta documentación proporciona una visión completa del sistema, desde la estructura de datos hasta los flujos de negocio y la arquitectura técnica implementada.

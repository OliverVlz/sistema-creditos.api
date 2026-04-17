# Carga masiva de clientes y solicitudes

## Endpoints

- `GET /clients/import/clients-loans/template`
  - Redirige a la URL configurada en `MASSIVE_IMPORT_TEMPLATE_URL`.
  - Si no está configurada, genera y retorna la plantilla local.
  - Requiere rol `ADMIN` o `ASESOR`.

- `POST /clients/import/clients-loans`
  - Content-Type: `multipart/form-data`
  - Campos:
    - `file` (requerido): archivo `.xlsx` o `.csv`
    - `chunkSize` (opcional): entero entre `1` y `200`, default `20`
  - Requiere rol `ADMIN` o `ASESOR`.

## Variables de entorno

- `MASSIVE_IMPORT_TEMPLATE_URL`
  - URL pública del archivo `.xlsx` en MinIO/S3 para descarga de plantilla.
  - Ejemplo:
    - `https://s3-minio.72.61.79.221.nip.io/public/branding/Plantilla-subida-masiva.xlsx`

## Columnas en Excel

Se aceptan encabezados en inglés y también aliases en español.
El importador soporta tanto Excel (`.xlsx`) como CSV (`.csv`).

- `email`
- `password`
- `firstName`
- `lastName`
- `documentNumber`
- `phoneNumber`
- `birthDate` (`DD-MM-YYYY` o `DD/MM/YYYY`)
- `address` (opcional)
- `employmentStatus` (`ACTIVO` o `JUBILADO`, opcional)
- `organizationName` (opcional)

Columnas opcionales para crear solicitud en la misma fila:

- `loanTypeName`
- `amountRequested`
- `termMonths`

Regla: si deseas crear solicitud, debes diligenciar las 3 (`loanTypeName`, `amountRequested`, `termMonths`). Si las 3 van vacías, se crea solo el cliente.
Regla de tipo de préstamo: por ahora solo se permite `Libranza`.
Regla para múltiples solicitudes: puedes repetir `email` + `documentNumber` en varias filas y cada fila generará una solicitud nueva para el mismo cliente.
Si `birthDate`, `address`, `employmentStatus` u `organizationName` van vacías, se guardan como `null`.
Regla de organización: si envías `organizationName`, debe coincidir exactamente con el catálogo seeded (incluyendo tildes): `Policía Nacional`, `Ejército Nacional`, `Armada Nacional`, `Fuerza Aeroespacial`.

Aliases en español soportados:

- `email`: `correo`, `correoElectronico`
- `password`: `contrasena`, `clave`
- `firstName`: `nombre`, `nombres`
- `lastName`: `apellido`, `apellidos`
- `documentNumber`: `documento`, `numeroDocumento`
- `phoneNumber`: `telefono`, `celular`
- `birthDate`: `fechaNacimiento`
- `address`: `direccion`, `domicilio`
- `employmentStatus`: `estadoLaboral`, `estadoEmpleo`
- `organizationName`: `organizacion`, `nombreOrganizacion`
- `loanTypeName`: `tipoPrestamo`
- `amountRequested`: `montoSolicitado`, `monto`
- `termMonths`: `plazoMeses`, `plazo`

## Reglas de negocio aplicadas

- Si el cliente no existe, se crea.
- Si el cliente ya existe (mismo email/documento), no se vuelve a crear y la fila se procesa como solicitud adicional.
- Si la fila incluye `loanTypeName`, `amountRequested` y `termMonths`, también crea una solicitud nueva.
- Se permiten múltiples filas para el mismo cliente dentro del mismo archivo.
- No se permiten inconsistencias de identidad (`email` con dos documentos distintos o `documento` con dos correos distintos).
- Si una fila falla, no bloquea el resto del archivo.
- Cada fila se procesa en transacción independiente.
- La organización se resuelve por `organizationName`.
- El tipo de préstamo se resuelve por `loanTypeName`.
- `amountRequested` y `termMonths` se validan contra límites del tipo de préstamo.
- El número de solicitud (`loan_number`) se genera con lock de tabla para reducir colisiones concurrentes.
- Los cálculos de cuota, interés y total se generan en backend.

## Respuesta

```json
{
  "fileName": "clientes.xlsx",
  "totalRows": 10,
  "processedRows": 10,
  "successRows": 8,
  "errorRows": 2,
  "results": [
    {
      "rowNumber": 2,
      "status": "SUCCESS",
      "email": "cliente@correo.com",
      "documentNumber": "12345678",
      "clientId": "uuid",
      "loanId": "uuid",
      "loanNumber": "LOAN-000123"
    },
    {
      "rowNumber": 3,
      "status": "ERROR",
      "email": "duplicado@correo.com",
      "documentNumber": "99887766",
      "errorCode": "Bad Request Exception",
      "errorMessage": "El email ya existe en el sistema"
    }
  ]
}
```

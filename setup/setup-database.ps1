# Script para crear la base de datos PostgreSQL para desarrollo local
# Ejecutar este script en PowerShell como administrador

param(
  [string]$PostgreSQLPath = "",
  [string]$Username = "postgres",
  [string]$DatabaseName = "sistema_creditos_dev",
  [SecureString]$Password
)

Write-Host "=== Configuracion de Base de Datos para Sistema de Creditos ===" -ForegroundColor Green
Write-Host ""

# Función para detectar PostgreSQL automáticamente
function Find-PostgreSQL {
  Write-Host "Detectando instalacion de PostgreSQL..." -ForegroundColor Cyan
    
  # Rutas comunes de PostgreSQL
  $commonPaths = @(
    "C:\Program Files\PostgreSQL\*\bin",
    "C:\PostgreSQL\*\bin",
    "C:\Program Files (x86)\PostgreSQL\*\bin"
  )
    
  foreach ($pathPattern in $commonPaths) {
    $foundPaths = Get-ChildItem -Path $pathPattern -ErrorAction SilentlyContinue | Where-Object { $_.PSIsContainer }
    foreach ($path in $foundPaths) {
      $psqlPath = Join-Path $path.FullName "psql.exe"
      if (Test-Path $psqlPath) {
        $version = $path.Parent.Name
        Write-Host "OK: PostgreSQL $version encontrado en: $($path.FullName)" -ForegroundColor Green
        return $path.FullName
      }
    }
  }
    
  # Verificar si está en el PATH
  try {
    $psqlVersion = & "psql" --version 2>$null
    if ($psqlVersion) {
      Write-Host "OK: PostgreSQL encontrado en PATH del sistema" -ForegroundColor Green
      return "psql"  # Usar comando directo
    }
  }
  catch {
    # Continuar buscando
  }
    
  return $null
}

# Detectar PostgreSQL si no se especificó ruta
if ([string]::IsNullOrEmpty($PostgreSQLPath)) {
  $PostgreSQLPath = Find-PostgreSQL
}

# Determinar el comando psql a usar
if ($PostgreSQLPath -eq "psql") {
  $psqlCommand = "psql"
}
else {
  $psqlCommand = Join-Path $PostgreSQLPath "psql.exe"
}

# Verificar si psql está disponible
if ($null -eq $PostgreSQLPath -or (-not (Test-Path $psqlCommand) -and $PostgreSQLPath -ne "psql")) {
  Write-Host "ERROR: No se encontro PostgreSQL instalado" -ForegroundColor Red
  Write-Host "Opciones:" -ForegroundColor Yellow
  Write-Host "   1. Instalar PostgreSQL desde: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
  Write-Host "   2. Especificar la ruta correcta: .\setup-database.ps1 -PostgreSQLPath 'C:\tu\ruta\postgresql\bin'" -ForegroundColor Yellow
  Write-Host "   3. Agregar PostgreSQL al PATH del sistema" -ForegroundColor Yellow
  exit 1
}

Write-Host "Usando comando PostgreSQL: $psqlCommand" -ForegroundColor Green

# Solicitar contraseña si no se proporcionó
if (-not $Password) {
  $Password = Read-Host "Ingresa la contrasena para el usuario '$Username'" -AsSecureString
}

# Convertir SecureString a texto plano para la variable de entorno
$plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($Password))

# Configurar variable de entorno para la contraseña
$env:PGPASSWORD = $plainPassword

Write-Host ""
Write-Host "Verificando conexion a PostgreSQL..." -ForegroundColor Cyan
& $psqlCommand -h localhost -U $Username -c "SELECT version();" *>$null
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: No se pudo conectar a PostgreSQL" -ForegroundColor Red
  Write-Host "Verifica que:" -ForegroundColor Yellow
  Write-Host "   1. PostgreSQL este ejecutandose" -ForegroundColor Yellow
  Write-Host "   2. El usuario '$Username' exista" -ForegroundColor Yellow
  Write-Host "   3. La contrasena sea correcta" -ForegroundColor Yellow
  # Limpiar variable de entorno
  $env:PGPASSWORD = $null
  exit 1
}

Write-Host ""
Write-Host "OK: Conexion a PostgreSQL exitosa" -ForegroundColor Green

# Verificar si la base de datos ya existe
Write-Host ""
Write-Host "Verificando si la base de datos '$DatabaseName' existe..." -ForegroundColor Cyan
$dbExists = & $psqlCommand -h localhost -U $Username -lqt | Select-String -Pattern $DatabaseName
if ($dbExists) {
  Write-Host "AVISO: La base de datos '$DatabaseName' ya existe" -ForegroundColor Yellow
  $response = Read-Host "Deseas recrearla? Esto eliminara todos los datos existentes (y/N)"
  if ($response -eq "y" -or $response -eq "Y" -or $response -eq "yes") {
    Write-Host "Eliminando base de datos existente..." -ForegroundColor Red
    & $psqlCommand -h localhost -U $Username -c "DROP DATABASE IF EXISTS $DatabaseName;"
    if ($LASTEXITCODE -ne 0) {
      Write-Host "ERROR: Error al eliminar la base de datos" -ForegroundColor Red
      # Limpiar variable de entorno
      $env:PGPASSWORD = $null
      exit 1
    }
  }
  else {
    Write-Host "OK: Usando base de datos existente" -ForegroundColor Green
    # Limpiar variable de entorno
    $env:PGPASSWORD = $null
    exit 0
  }
}

# Crear la base de datos
Write-Host ""
Write-Host "Creando base de datos '$DatabaseName'..." -ForegroundColor Cyan
& $psqlCommand -h localhost -U $Username -c "CREATE DATABASE $DatabaseName;"
if ($LASTEXITCODE -ne 0) {
  Write-Host "ERROR: Error al crear la base de datos" -ForegroundColor Red
  # Limpiar variable de entorno
  $env:PGPASSWORD = $null
  exit 1
}

Write-Host "OK: Base de datos '$DatabaseName' creada exitosamente" -ForegroundColor Green

# Verificar la creación
Write-Host ""
Write-Host "Verificando la base de datos creada..." -ForegroundColor Cyan
& $psqlCommand -h localhost -U $Username -d $DatabaseName -c "SELECT current_database();" *>$null
if ($LASTEXITCODE -eq 0) {
  Write-Host "OK: Verificacion exitosa" -ForegroundColor Green
}
else {
  Write-Host "ERROR: Error en la verificacion" -ForegroundColor Red
  $env:PGPASSWORD = $null
  exit 1
}

# Limpiar variable de entorno por seguridad
$env:PGPASSWORD = $null

Write-Host ""
Write-Host "Configuracion completada!" -ForegroundColor Green
Write-Host ""
Write-Host "Proximos pasos:" -ForegroundColor Cyan
Write-Host "   1. Instalar dependencias: pnpm install" -ForegroundColor White
Write-Host "   2. Ejecutar migraciones: pnpm migration:run" -ForegroundColor White
Write-Host "   3. Poblar datos de prueba: pnpm seed" -ForegroundColor White
Write-Host "   4. Iniciar el servidor: pnpm start" -ForegroundColor White
Write-Host ""
Write-Host "Configuracion de la base de datos:" -ForegroundColor Cyan
Write-Host "   - Host: localhost" -ForegroundColor White
Write-Host "   - Puerto: 5432" -ForegroundColor White
Write-Host "   - Usuario: $Username" -ForegroundColor White
Write-Host "   - Base de datos: $DatabaseName" -ForegroundColor White
Write-Host "   4. Iniciar el servidor: pnpm start" -ForegroundColor White
Write-Host ""
Write-Host "Configuracion de la base de datos:" -ForegroundColor Cyan
Write-Host "   - Host: localhost" -ForegroundColor White
Write-Host "   - Puerto: 5432" -ForegroundColor White
Write-Host "   - Usuario: $Username" -ForegroundColor White
Write-Host "   - Base de datos: $DatabaseName" -ForegroundColor White

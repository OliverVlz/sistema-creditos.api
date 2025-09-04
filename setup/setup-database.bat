@echo off
REM Script para crear la base de datos PostgreSQL para desarrollo local
REM Ejecutar este script en CMD como administrador

echo ============================================================
echo    Configuracion de Base de Datos para Sistema de Creditos
echo ============================================================
echo.

REM Configuracion predeterminada
set POSTGRESQL_PATH=C:\Program Files\PostgreSQL\17\bin
set USERNAME=postgres
set DATABASE_NAME=sistema_creditos_dev

REM Verificar si psql esta disponible
if not exist "%POSTGRESQL_PATH%\psql.exe" (
    echo [ERROR] No se encontro psql en: %POSTGRESQL_PATH%
    echo.
    echo Opciones:
    echo   1. Instalar PostgreSQL desde: https://www.postgresql.org/download/windows/
    echo   2. Modificar la variable POSTGRESQL_PATH en este script
    echo   3. Agregar PostgreSQL al PATH del sistema
    pause
    exit /b 1
)

echo [OK] PostgreSQL encontrado en: %POSTGRESQL_PATH%

REM Verificar conexion a PostgreSQL
echo.
echo Verificando conexion a PostgreSQL...
"%POSTGRESQL_PATH%\psql.exe" -U %USERNAME% -c "SELECT version();" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] No se pudo conectar a PostgreSQL
    echo.
    echo Verifica que:
    echo   1. PostgreSQL este ejecutandose
    echo   2. El usuario '%USERNAME%' exista
    echo   3. La contraseña sea correcta
    pause
    exit /b 1
)

echo [OK] Conexion a PostgreSQL exitosa

REM Crear la base de datos
echo.
echo Creando base de datos '%DATABASE_NAME%'...
"%POSTGRESQL_PATH%\psql.exe" -U %USERNAME% -c "DROP DATABASE IF EXISTS %DATABASE_NAME%;"
"%POSTGRESQL_PATH%\psql.exe" -U %USERNAME% -c "CREATE DATABASE %DATABASE_NAME%;"
if errorlevel 1 (
    echo [ERROR] Error al crear la base de datos
    pause
    exit /b 1
)

echo [OK] Base de datos '%DATABASE_NAME%' creada exitosamente

REM Verificar la creacion
echo.
echo Verificando la base de datos creada...
"%POSTGRESQL_PATH%\psql.exe" -U %USERNAME% -d %DATABASE_NAME% -c "SELECT current_database();" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Error en la verificacion
    pause
    exit /b 1
)

echo [OK] Verificacion exitosa

echo.
echo ============================================================
echo                    CONFIGURACION COMPLETADA
echo ============================================================
echo.
echo Proximos pasos:
echo   1. Instalar dependencias: pnpm install
echo   2. Configurar entorno: npm run env:local
echo   3. Ejecutar migraciones: npm run local:migration:run
echo   4. Poblar datos de prueba: npm run local:seed
echo   5. Iniciar el servidor: npm run local:start
echo.
echo Configuracion de la base de datos:
echo   - Host: localhost
echo   - Puerto: 5432
echo   - Usuario: %USERNAME%
echo   - Base de datos: %DATABASE_NAME%
echo.
pause

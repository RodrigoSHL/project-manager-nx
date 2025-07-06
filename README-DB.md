# 🗄️ Configuración de Base de Datos

## 🚀 Inicio Rápido

### 1. Configurar Variables de Entorno

```bash
# Usar el script automático (recomendado)
./setup-env.sh

# O manualmente
cp env.example .env
```

### 2. Levantar PostgreSQL con Docker

```bash
# Levantar la base de datos
docker-compose up -d

# Verificar que esté corriendo
docker-compose ps
```

### 3. Conectar a la Base de Datos

```bash
# Conectar con psql
docker exec -it project_management_db psql -U postgres -d project_management_db

# O desde tu máquina local
psql -h localhost -p 5432 -U postgres -d project_management_db
```

## 📊 Información de Conexión

Las variables se configuran en el archivo `.env` en la raíz del proyecto:

- **Host**: `${DATABASE_HOST}` (por defecto: `localhost`)
- **Puerto**: `${DATABASE_PORT}` (por defecto: `5432`)
- **Base de datos**: `${DATABASE_NAME}` (por defecto: `project_management_db`)
- **Usuario**: `${DATABASE_USERNAME}` (por defecto: `postgres`)
- **Contraseña**: `${DATABASE_PASSWORD}` (por defecto: `postgres`)

## 🛠️ Comandos Útiles

```bash
# Configurar entorno
./setup-env.sh

# Levantar base de datos
docker-compose up -d

# Detener base de datos
docker-compose down

# Ver logs
docker-compose logs postgres

# Resetear base de datos (eliminar datos)
docker-compose down -v
docker-compose up -d

# Ver estado
docker-compose ps
```

## 🔍 Verificar Conexión

```bash
# Verificar que PostgreSQL esté listo
docker exec project_management_db pg_isready -U postgres -d project_management_db

# Listar bases de datos
docker exec project_management_db psql -U postgres -l

# Verificar variables de entorno
cat .env

# Verificar tablas creadas
./check-db.sh
```

## 📝 Variables de Entorno Principales

El archivo `.env` contiene todas las configuraciones del monorepo:

```env
# Base de Datos
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=project_management_db
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=postgres

# API
API_PORT=3000
API_PREFIX=api
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3001
```

## 🔧 Personalización

### Cambiar Puerto de la Base de Datos

```bash
# Editar .env
DATABASE_PORT=5433

# Reiniciar Docker Compose
docker-compose down
docker-compose up -d
```

### Cambiar Credenciales

```bash
# Editar .env
DATABASE_USERNAME=mi_usuario
DATABASE_PASSWORD=mi_contraseña

# Resetear base de datos
docker-compose down -v
docker-compose up -d
```

## 🚨 Notas Importantes

1. **El archivo `.env` debe estar en la raíz del monorepo**
2. **Docker Compose lee automáticamente las variables del `.env`**
3. **La API carga las variables desde la raíz del proyecto**
4. **Los cambios en `.env` requieren reiniciar los servicios**
5. **Usuario por defecto: `postgres`**
6. **Contraseña por defecto: `postgres`**
7. **Base de datos por defecto: `project_management_db`**

## 🔄 Flujo de Trabajo

```bash
# 1. Configurar entorno (solo la primera vez)
./setup-env.sh

# 2. Levantar base de datos
docker-compose up -d

# 3. Iniciar la API
npm run serve project-api

# 4. Probar conexión
curl http://localhost:3000/api/projects

# 5. Verificar tablas
./check-db.sh
``` 
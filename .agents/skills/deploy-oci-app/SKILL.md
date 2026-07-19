---
name: deploy-oci-app
description: Agrega, integra, dockeriza, despliega y diagnostica aplicaciones del monorepo Nx de Project Manager en la VM Oracle Cloud de atomdev.cl. Usar cuando Codex deba crear o conectar un frontend Next.js, API NestJS, rutas o clientes BFF, base PostgreSQL, servicios Docker Compose, rutas Caddy, subdominios Cloudflare, despliegues OCI, verificaciones HTTPS, rollback o correcciones de producción relacionadas con esta plataforma.
---

# Deploy OCI App

## Fuente operativa

Leer completamente `../../../docs/ADDING_APPLICATION_OCI.md` antes de diseñar, implementar o desplegar. Tratar esa guía como la fuente detallada del entorno, arquitectura, comandos, incidentes conocidos y checklist.

Leer además los archivos vigentes que entren en alcance:

- `docker-compose.prod.yml`;
- `Dockerfile.api` y `Dockerfile.next`;
- `docker/Caddyfile` y `docker/init-db.sh`;
- `env.deploy.example`;
- `project.json`, configuración y código de aplicaciones relacionadas.

No asumir que la documentación reemplaza el estado real del repositorio o de producción.

## Clasificar la solicitud

Determinar si el usuario pide:

- diseño o documentación;
- revisión o diagnóstico;
- implementación local;
- despliegue en producción;
- DNS, TLS o Cloudflare;
- rollback.

Para revisión o diagnóstico, no modificar código ni producción salvo que el usuario también pida la corrección. Para despliegue, completar todas las puertas de validación siguientes.

## Flujo obligatorio

### 1. Descubrir el estado

Inspeccionar antes de editar:

```text
git status --short
proyectos Nx existentes
puertos y variables utilizadas
servicios de docker-compose.prod.yml
rutas del BFF
hosts de Caddy
configuración de PostgreSQL
```

Preservar cambios del usuario. No sobrescribir archivos remotos sin entender su función.

Si se inspecciona `.env` o `.env.deploy`, mostrar solo nombres de variables y redactar valores.

### 2. Definir el contrato de la aplicación

Registrar explícitamente:

- slug del frontend;
- slug del API;
- puerto interno del API;
- nombre y variables de base;
- variable y URL interna del BFF;
- prefijos públicos;
- dominio `<app>.atomdev.cl`;
- health endpoint;
- necesidad de autenticación y migraciones.

Detectar colisiones antes de implementar.

### 3. Implementar por capas

Aplicar en este orden:

1. API NestJS, entidades, configuración, health y build Nx.
2. Frontend Next.js con `NEXT_PUBLIC_API_URL=/api`.
3. Cliente, controlador o proxy del BFF con nombre de servicio Docker.
4. Base e inicialización para instalaciones nuevas.
5. Servicios Compose y dependencias saludables.
6. Ruta Caddy para frontend y `/api/*`.
7. Variables de ejemplo sin secretos.
8. Documentación si cambia el patrón común.

No usar `localhost` entre contenedores. No incorporar la IP OCI ni URLs HTTP en bundles públicos.

### 4. Validar localmente

Antes de producción:

1. ejecutar `docker compose config --quiet` con secretos de prueba;
2. construir todas las imágenes afectadas;
3. exigir éxito de Nx, Next.js, Webpack y TypeScript;
4. buscar URLs HTTP antiguas en `.next/static`;
5. probar health del API y BFF;
6. comprobar el flujo funcional principal.

No omitir el build porque una imagen antigua siga funcionando.

### 5. Preparar producción

Ejecutar preflight de solo lectura:

- comprobar VM, arquitectura, disco y puertos;
- listar Compose y contenedores;
- confirmar el directorio remoto;
- comprobar que las dependencias estén saludables.

Antes de modificar datos:

- crear y verificar backup PostgreSQL;
- respaldar `.env.deploy`, Compose y Caddy;
- conservar imágenes anteriores para rollback.

Nunca borrar volúmenes, ejecutar `git reset --hard`, limpiar imágenes de rollback ni recrear PostgreSQL como atajo.

### 6. Sincronizar y desplegar

Excluir siempre de la transferencia:

```text
.git
node_modules
.nx
dist
.env
.env.deploy
*.key
*.pem
.DS_Store
```

No reemplazar `.env.deploy` remoto con archivos locales.

Desplegar en orden API → BFF → frontend → Caddy. Usar `--no-deps` para preservar servicios no relacionados solo después de comprobar que las dependencias ya están activas.

Si la base usa un volumen existente, crear la base manualmente después del backup; los scripts de init no volverán a ejecutarse.

### 7. Configurar DNS y TLS

Para un subdominio nuevo de `atomdev.cl`:

1. no modificar NIC Chile;
2. crear el registro A en Cloudflare como DNS only;
3. apuntarlo a la IP OCI documentada;
4. comprobar que Caddy emita un certificado válido;
5. mantener Cloudflare en Full (strict);
6. activar Proxied;
7. verificar DNS, HTTPS y `server: cloudflare`.

No usar SSL Flexible. No abrir puertos particulares por aplicación cuando Caddy puede publicar por `443`.

### 8. Verificar y cerrar

Comprobar como mínimo:

- contenedores esperados activos;
- API y BFF saludables;
- frontend `200` por HTTPS;
- health `200` por HTTPS;
- DNS proxied por Cloudflare;
- ausencia de mixed content y errores CORS;
- ausencia de URL de origen en bundles;
- puertos públicos limitados;
- aplicaciones anteriores aún disponibles.

Si una validación falla, investigar antes de repetir builds o recrear servicios.

## Guardas de seguridad

- No imprimir contraseñas, JWT, claves privadas, tokens Cloudflare ni API keys OCI.
- No enviar secretos al contexto Docker.
- No publicar PostgreSQL ni APIs internos.
- No usar `TYPEORM_SYNCHRONIZE=true` como estado final de una aplicación estable.
- No cambiar reglas OCI completas sin leer y preservar las existentes.
- No asumir que un `rsync` actualizó un archivo montado: recrear solo el contenedor cuando cambie el inode.
- No declarar éxito hasta probar el sistema desde Internet y desde la red interna cuando corresponda.

## Respuesta de cierre

Entregar:

- resultado y URLs;
- servicios modificados;
- validaciones ejecutadas;
- backup o rollback disponible;
- riesgos o deuda pendiente;
- archivos locales cambiados y estado de commit.

Mantener la explicación proporcional al cambio y señalar cualquier acción manual que aún dependa del usuario.

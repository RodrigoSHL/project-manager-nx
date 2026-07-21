# Checklist de integración

## 1. Contrato y colisiones

- [ ] Slugs Nx únicos y coherentes (`<dominio>-api`, `<dominio>-web/app`).
- [ ] Puerto API libre en código, Compose y health checks.
- [ ] Base y variables `<PREFIX>_DB_*` sin colisiones.
- [ ] Variable BFF `<PREFIX>_API_URL` y URL Docker definidas.
- [ ] Prefijo, health, autenticación, migraciones y dominio decididos.

## 2. Generación Nx

- [ ] Consultar versión local de Nx y schema del generador.
- [ ] Ejecutar el generador oficial, no copiar carpetas completas.
- [ ] Confirmar `project.json`, sourceRoot y salida
      `dist/apps/<proyecto>/main.js` para NestJS.
- [ ] Preservar cambios locales preexistentes.

## 3. API NestJS

- [ ] Cargar `.env` antes de resolver TypeORM (`forRootAsync`).
- [ ] `API_PREFIX`, puerto, CORS y `ValidationPipe` configurados.
- [ ] `GET /api/health` sin autenticación.
- [ ] DTOs, entidades, servicios, controladores y errores implementados.
- [ ] No devolver secretos, claves internas de storage ni datos binarios en
      listados de metadatos.
- [ ] Tests del dominio y del health.

## 4. PostgreSQL

- [ ] Base independiente cuando el dominio lo requiera.
- [ ] Entidades y migración versionada registradas.
- [ ] `migrationsRun` controlado por variable propia.
- [ ] `TYPEORM_SYNCHRONIZE=false` en Compose productivo.
- [ ] `docker/init-db.sh` actualizado para instalaciones nuevas.
- [ ] Base existente creada solo después de backup; propietario/grants
      comprobados.
- [ ] Conexión probada con las mismas credenciales de la aplicación.

## 5. Variables y secretos

- [ ] `env.example` contiene variables locales y placeholders.
- [ ] `env.deploy.example` contiene nombres/defaults no sensibles.
- [ ] `.env`, `.env.deploy`, claves y tokens permanecen ignorados.
- [ ] Docker context excluye `.env*`, `*.key` y `*.pem`.
- [ ] Ningún secreto aparece en logs, diff, documentación o argumentos de
      build.

## 6. BFF y frontend

- [ ] BFF usa `http://<servicio>:<puerto>/api` en Compose.
- [ ] Ruta o cliente BFF cubre JSON, multipart y streaming si aplica.
- [ ] BFF espera el health del API.
- [ ] Frontend usa `/api`, nunca IP OCI o URL HTTP interna.
- [ ] Rewrites usan una variable server-side, no `NEXT_PUBLIC_*` interna.
- [ ] CORS incluye localhost y dominio HTTPS correspondiente.

## 7. Docker, Caddy y despliegue

- [ ] `Dockerfile.api`/`Dockerfile.next` compartidos construyen la app.
- [ ] API y PostgreSQL no tienen puertos públicos.
- [ ] Compose incluye environment, depends_on y healthcheck.
- [ ] Caddy enruta `/api/*` al BFF y el resto al frontend.
- [ ] Caddy depende del frontend y BFF apropiados.
- [ ] `scripts/deploy-oci.sh` reconoce el servicio y sus perfiles si debe
      desplegarse.
- [ ] DNS/TLS solo se configura cuando fue solicitado.

## 8. Validación local

```text
nx lint <proyecto>
nx test <proyecto>
nx build <proyecto> --configuration=production
DATABASE_PASSWORD=validation-only JWT_SECRET=validation-only \
  docker compose -f docker-compose.prod.yml config --quiet
docker compose -f docker-compose.prod.yml build <servicios-afectados>
```

- [ ] Health API responde `200`.
- [ ] Health BFF responde `200` si fue modificado.
- [ ] Flujo funcional principal probado.
- [ ] No hay URLs HTTP/IP OCI en bundles Next.js.
- [ ] `git diff --check` y formateo pasan.

## 9. Producción

- [ ] Preflight OCI de solo lectura.
- [ ] Backup PostgreSQL, entorno, Compose y Caddy verificados.
- [ ] Imágenes previas etiquetadas para rollback.
- [ ] Despliegue ordenado API → BFF → frontend → Caddy.
- [ ] Health interno y HTTPS externo responden `200`.
- [ ] Cloudflare usa Full (strict), proxy y DNS correctos.
- [ ] Aplicaciones anteriores siguen operativas.
- [ ] Rollback documentado y disponible.

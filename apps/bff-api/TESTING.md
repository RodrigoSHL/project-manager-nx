# BFF Auth — Pruebas de integración

Resultados de las pruebas ejecutadas el 29/05/2026 con los servicios corriendo localmente.

| Servicio     | Puerto |
|--------------|--------|
| BFF API      | 3001   |
| project-api  | 3000   |
| user-api     | 3002   |

---

## Setup

```bash
# Login y guardar cookies en archivo (necesario para pruebas posteriores)
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -c /tmp/cookies.txt \
  -d '{"email":"juan@test.com","password":"Pass1234!"}' | jq
```

---

## 1. Registro

```bash
# Registro exitoso
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan Test","email":"juan@test.com","password":"Pass1234!"}' | jq
# Esperado: 201 { id, email, name, ... }

# Email inválido
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"X","email":"no-es-email","password":"Pass1234!"}' | jq
# Esperado: 400 { message: ["email must be an email"] }

# Email duplicado
curl -s -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Juan Test","email":"juan@test.com","password":"Pass1234!"}' | jq
# Esperado: 409 { message: "Email is already registered" }
```

---

## 2. Login

```bash
# Login correcto — tokens en cookies HttpOnly, NO en el body
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -c /tmp/cookies.txt \
  -d '{"email":"juan@test.com","password":"Pass1234!"}' | jq
# Esperado: 200 { user: { id, email, name, roles } }

# Verificar que las cookies son HttpOnly
cat /tmp/cookies.txt | grep -v "^#"
# Esperado: líneas con "#HttpOnly_localhost" para access_token y refresh_token

# Contraseña incorrecta
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@test.com","password":"WrongPassword123"}' | jq
# Esperado: 401 { message: "Invalid credentials" }

# Contraseña < 8 chars (rechazado por el BFF sin llegar a user-api)
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"juan@test.com","password":"wrong"}' | jq
# Esperado: 400 { message: ["password must be longer than or equal to 8 characters"] }

# Campos vacíos
curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{}' | jq
# Esperado: 400 con array de errores de validación
```

---

## 3. Rutas protegidas

```bash
# GET /me con sesión válida
curl -s http://localhost:3001/api/auth/me -b /tmp/cookies.txt | jq
# Esperado: 200 { user: { id, email, roles } }

# GET /me sin cookies
curl -s http://localhost:3001/api/auth/me | jq
# Esperado: 401 { message: "Unauthorized" }

# GET /projects con sesión (pasa por proxy → project-api)
curl -s http://localhost:3001/api/projects -b /tmp/cookies.txt | jq '.[0].name'
# Esperado: 200 nombre del primer proyecto

# GET /projects sin sesión
curl -s http://localhost:3001/api/projects | jq
# Esperado: 401 { message: "Unauthorized" }
```

---

## 4. Refresh token y rotación

```bash
# Guardar copia de cookies actuales
cp /tmp/cookies.txt /tmp/cookies_old.txt

# Refresh — emite nuevas cookies y revoca las anteriores
curl -s -X POST http://localhost:3001/api/auth/refresh \
  -b /tmp/cookies.txt -c /tmp/cookies.txt | jq
# Esperado: 200 { user: { ... } } + nuevas cookies seteadas

# Intentar usar el refresh token viejo (debe estar revocado)
curl -s -X POST http://localhost:3001/api/auth/refresh \
  -b /tmp/cookies_old.txt | jq
# Esperado: 401 { message: "Invalid or expired refresh token" }
```

---

## 5. Logout

```bash
# Logout — revoca refresh token y limpia cookies
curl -s -X POST http://localhost:3001/api/auth/logout \
  -b /tmp/cookies.txt -c /tmp/cookies.txt | jq
# Esperado: 200 { message: "Logged out" }

# /me después del logout
curl -s http://localhost:3001/api/auth/me -b /tmp/cookies.txt | jq
# Esperado: 401

# /projects después del logout
curl -s http://localhost:3001/api/projects -b /tmp/cookies.txt | jq
# Esperado: 401
```

---

## 6. Seguridad — acceso directo a backends

```bash
# project-api sin headers X-User-* (InternalAuthGuard bloqueando)
curl -s http://localhost:3000/api/projects | jq
# Esperado: 401 { message: "Missing internal auth headers" }

# Simulación de atacante pasando headers a mano — PASA intencionalmente
# En producción el puerto 3000 no está expuesto fuera del cluster
curl -s http://localhost:3000/api/projects \
  -H "x-user-id: cualquier-uuid" \
  -H "x-user-email: hacker@x.com" \
  -H "x-user-roles: user" | jq
# Esperado: 200 — el backend confía en la red privada, el firewall lo protege en prod
```

---

## Scorecard

| # | Escenario | HTTP | Estado |
|---|-----------|------|--------|
| 1 | Registro exitoso | 201 | ✅ |
| 2 | Login correcto, tokens en cookies HttpOnly | 200 | ✅ |
| 3 | Login contraseña incorrecta | 401 | ✅ |
| 4 | Login contraseña < 8 chars (BFF valida) | 400 | ✅ |
| 5 | Login DTO vacío | 400 | ✅ |
| 6 | `/me` con sesión | 200 | ✅ |
| 7 | `/me` sin sesión | 401 | ✅ |
| 8 | `/projects` con sesión (proxy) | 200 | ✅ |
| 9 | `/projects` sin sesión | 401 | ✅ |
| 10 | Refresh — rotación de token | 200 | ✅ |
| 11 | Refresh con token ya usado | 401 | ✅ |
| 12 | Logout | 200 | ✅ |
| 13 | `/me` post-logout | 401 | ✅ |
| 14 | project-api directo sin headers | 401 | ✅ |
| 15 | Register email inválido | 400 | ✅ |
| 16 | Register email duplicado | 409 | ✅ |

---

## Bugs encontrados y corregidos

| Bug | Causa | Fix |
|-----|-------|-----|
| `/api/auth/register` devolvía 401 | `req.path` devuelve ruta relativa al mount point en Express, sin el prefijo `/api` | Cambiado a `req.originalUrl.split('?')[0]` en `jwt-cookie.middleware.ts` |
| `/api/projects` devolvía 500 | `cookie: undefined` en headers del proxy lanza `TypeError` en Node.js `http.request` | Cambiado a `delete forwardedHeaders['cookie']` en `proxy.middleware.ts` |
| Login con contraseña incorrecta devolvía 500 | BFF atrapaba cualquier error no-401 como 500 genérico | Se lee el body del error de user-api y se propaga correctamente |
| DTO del BFF no validaba longitud mínima de password | `LoginDto` del BFF no tenía `@MinLength(8)` | Alineado con el DTO de user-api |

---
description: "Use when working on authentication, authorization, JWT, cookies, guards, auth middleware, login, refresh tokens, BFF proxy, X-User headers, or adding a new backend service to the monorepo."
applyTo:
  - "**/auth/**"
  - "**/guards/**"
  - "**/middleware/jwt*"
  - "**/contexts/auth-context*"
  - "**/middleware.ts"
  - "**/lib/fetch-with-auth*"
---

# Auth & Authz Architecture — project-manager-nx

## Strategy: BFF-Centric JWT (Trusted Network)

The BFF (`bff-api`, port 3001) is the **only public entry point**. It is the sole validator of JWTs. Backend services run in a private network and **never validate tokens** — they trust the headers injected by the BFF.

```
Browser (HttpOnly cookie)
  └─► BFF (validates JWT, injects X-User-* headers)
        ├─► project-api  (reads X-User-Id, no JWT logic)
        └─► user-api     (auth source of truth + user/workspace data)
```

---

## Key Invariants

- **Never add JWT validation to a backend** (`project-api`, `user-api` feature endpoints). Only the BFF validates tokens.
- **Never send the cookie to a backend**. The proxy strips the `cookie` header before forwarding.
- **Always use `credentials: 'include'`** in frontend `fetch` calls so the browser sends cookies.
- **Public paths in BFF** are whitelisted in `JwtCookieMiddleware` and must also be excluded from the proxy: `/api/auth/login`, `/api/auth/register`, `/api/auth/refresh`, `/api/auth/logout`.

---

## Files & Responsibilities

### BFF (`apps/bff-api/`)

| File | Role |
|------|------|
| `src/main.ts` | Registers `cookie-parser`, `ValidationPipe`, CORS with `credentials: true` |
| `src/app/auth/bff-auth.controller.ts` | `POST login/register/refresh/logout`, `GET me` — manages HttpOnly cookies |
| `src/app/auth/bff-auth.service.ts` | Calls user-api via `fetch` internally |
| `src/app/auth/bff-auth.module.ts` | Registers `JwtModule` (same secret as user-api) |
| `src/app/middleware/jwt-cookie.middleware.ts` | Validates `access_token` cookie → injects `X-User-Id`, `X-User-Email`, `X-User-Roles` |
| `src/app/proxy/proxy.middleware.ts` | Forwards `X-User-*` headers, strips `cookie`, excludes `/api/auth/(.*)` |
| `src/app/app.module.ts` | Applies `JwtCookieMiddleware` first (all routes), then `ProxyMiddleware` (excluding `/api/auth`) |

### user-api (`apps/user-api/`)

| File | Role |
|------|------|
| `src/auth/auth.service.ts` | Issues JWT + refresh token; `login()`, `refresh()`, `logout()` |
| `src/auth/entities/refresh-token.entity.ts` | SHA-256 hash of token in DB, 7-day TTL, `revokedAt` for rotation |
| `src/auth/auth.module.ts` | `JwtModule.register()` with same secret as BFF |
| `src/workspace-members/workspace-members.controller.ts` | `GET :workspaceId/members/:userId/role` — used by RBAC guard |

### project-api (`apps/project-api/`)

| File | Role |
|------|------|
| `src/app/guards/internal-auth.guard.ts` | Global guard (APP_GUARD): rejects if `X-User-Id` header is missing |
| `src/app/decorators/current-user.decorator.ts` | `@CurrentUser()` → reads `X-User-*` headers into `RequestUser` |
| `src/app/guards/workspace-roles.guard.ts` | `@WorkspaceRoles('ADMIN')` → calls user-api to check role |
| `src/app/decorators/workspace-roles.decorator.ts` | Sets `workspaceRoles` metadata for the guard |

### Frontends (`apps/project-web/`, `apps/jira-web/`)

| File | Role |
|------|------|
| `contexts/auth-context.tsx` | `AuthProvider`, `useAuth()` — user state, `login()`, `logout()`, `refresh()` |
| `app/login/page.tsx` | Login form, redirects to `?from=` param after auth |
| `middleware.ts` | Next.js edge middleware — redirects to `/login` if no `access_token` cookie |
| `lib/fetch-with-auth.ts` | Wraps `fetch` — on 401: calls `/api/auth/refresh`, retries once, then redirects to `/login` |

---

## Auth Flow

### Login
```
POST /api/auth/login { email, password }
  → BffAuthController → BffAuthService → user-api POST /api/auth/login
  ← { accessToken (15m JWT), refreshToken (random hex, 7d), user }
  ← BFF: sets HttpOnly cookies access_token + refresh_token
  ← Response to browser: { user }
```

### Authenticated Request
```
Browser (auto-sends cookies)
  → BFF JwtCookieMiddleware: verifies access_token cookie
  → Sets req.headers['x-user-id'], ['x-user-email'], ['x-user-roles']
  → ProxyMiddleware: strips cookie, forwards X-User-* to backend
  → Backend: reads headers, processes request
```

### Token Refresh (silent)
```
fetchWithAuth detects 401
  → POST /api/auth/refresh (cookie auto-sent)
  → BFF reads refresh_token cookie → calls user-api POST /api/auth/refresh
  → user-api: verifies hash, marks old token revokedAt, issues new pair
  → BFF: sets new HttpOnly cookies
  → fetchWithAuth retries original request
```

### Logout
```
POST /api/auth/logout
  → BFF reads refresh_token cookie → calls user-api POST /api/auth/logout
  → user-api: sets revokedAt on token
  → BFF: clears both cookies (access_token + refresh_token)
```

---

## RBAC Usage (project-api)

```typescript
// Minimum role required: ADMIN or OWNER
@WorkspaceRoles('ADMIN')
@UseGuards(WorkspaceRolesGuard)
@Post(':workspaceId/projects')
create(
  @Param('workspaceId') workspaceId: string,
  @CurrentUser() user: RequestUser,
  @Body() dto: CreateProjectDto,
) { ... }
```

The guard reads `workspaceId` from `req.params.workspaceId` or `req.body.workspaceId`.
Role hierarchy: `OWNER (3) > ADMIN (2) > MEMBER (1) > VIEWER (0)`

---

## Adding a New Backend Service (Lego)

1. **Create the NestJS app** (`npx nx g @nx/node:app my-api`)
2. **Add `InternalAuthGuard` as global guard** in its `AppModule`:
   ```typescript
   { provide: APP_GUARD, useClass: InternalAuthGuard }
   ```
3. **Copy `guards/internal-auth.guard.ts` and `decorators/current-user.decorator.ts`** from `project-api`
4. **Register the route in BFF proxy** (`proxy.middleware.ts`):
   ```typescript
   { prefix: '/api/my-resource', targetEnvVar: 'MY_API_URL', defaultUrl: 'http://localhost:3003' }
   ```
5. **Add env var** `MY_API_URL` to `.env` and `env.example`
6. **Done** — the new service is automatically authenticated via X-User-* headers

---

## Adding a New Frontend (Lego)

1. **Create Next.js app** (`npx nx g @nx/next:app my-web`)
2. **Copy** `contexts/auth-context.tsx`, `lib/fetch-with-auth.ts`, `middleware.ts`, `app/login/page.tsx` from `project-web`
3. **Wrap layout** with `<AuthProvider>` (outside `<WorkspaceProvider>`)
4. **Set** `NEXT_PUBLIC_API_URL` to the BFF URL
5. **Add** the new origin to BFF CORS list in `main.ts`

---

## Scaling Patterns

### Multiple BFF instances (horizontal scale)
JWTs are stateless — any BFF instance can validate them. Use the same `JWT_SECRET` across all instances (via Kubernetes secret or environment config).

### Auth external provider (OAuth / OIDC / LDAP)
Add a new strategy in `user-api` auth module. `AuthService.login()` becomes a façade:
- Local users → bcrypt path (current)
- OAuth users → exchange code for user profile → issue JWT same as today

The BFF and all backends are **unchanged** — they still just read `X-User-*` headers.

### Per-client deployments (Lego clients)
```
Client A (full):  BFF + project-web + jira-web → project-api + user-api
Client B (jira):  BFF + jira-web               → project-api + user-api
Client C (mgmt):  BFF + project-web            → project-api + user-api
```
Remove unused frontend apps from docker-compose / k8s manifests. Backend APIs and user-api always stay.

### Fine-grained permissions (future)
Extend `X-User-Roles` or add `X-User-Permissions` header in `JwtCookieMiddleware` after fetching from user-api. Backends remain unchanged — they just read a richer header.

### Audit log (future)
Add a NestJS interceptor in each backend that logs `X-User-Id + method + path + timestamp` to a logging service. No changes to auth flow.

---

## TypeScript Gotchas

```typescript
// JwtModule: expiresIn is ms.StringValue, not plain string — use `as any`
JwtModule.register({
  secret: process.env.JWT_SECRET || 'change-me-in-production',
  signOptions: { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any },
})

// cookieParser: must use require-style import, not ES import
import cookieParser = require('cookie-parser');
// NOT: import * as cookieParser from 'cookie-parser'  ← TS2349 error

// RefreshToken hash: use SHA-256 (crypto.createHash), not bcrypt
// bcrypt is for passwords (needs timing-safe compare); random tokens just need hash equality
const hash = crypto.createHash('sha256').update(rawToken).digest('hex');
```

---

## Environment Variables

```env
JWT_SECRET=<strong-random-secret-min-32-chars>
JWT_EXPIRES_IN=15m
USER_API_URL=http://localhost:3002
PROJECT_API_URL=http://localhost:3000
BFF_PORT=3001
BFF_CORS_ORIGIN=http://localhost:4200
```

---

## Build & Verification

```bash
# Build backends
npx nx build user-api --skip-nx-cache
npx nx build bff-api --skip-nx-cache
npx nx build project-api --skip-nx-cache

# Smoke test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  -c cookies.txt

# Smoke test protected route (using saved cookies)
curl http://localhost:3001/api/projects -b cookies.txt

# Direct backend access without BFF headers → should 401
curl http://localhost:3000/api/projects  # → 401 Missing internal auth headers
```

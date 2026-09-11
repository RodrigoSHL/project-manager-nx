---
name: tenant-auth-flow
description: Implementa o extiende autenticacion JWT y autorizacion multi-tenant de extremo a extremo en aplicaciones del monorepo Nx, cubriendo login React, BFF NestJS, membresias de tenant, API interna, PostgreSQL, guards y pruebas. Usar al agregar login real, proteger rutas por empresa, crear una administracion global de clientes o reutilizar el patron de GridAssets en otra aplicacion.
---

# Login y acceso multi-tenant

## Cargar el contexto

Leer antes de editar:

1. `references/gridassets-tenant-auth.md`.
2. `../../../docs/INSPECTION_RULES.md` si el alcance incluye GridAssets.
3. Los archivos reales de autenticacion, BFF, API y migraciones que entren en
   alcance. La referencia describe el patron actual, pero el repositorio es la
   fuente de verdad.

Si se agrega una aplicacion o servicio nuevo, aplicar tambien `create-nx-app`.
Si se solicita despliegue, aplicar ademas `deploy-oci-app`.

## Preservar estas reglas

- El login autentica una identidad. La membresia autoriza a esa identidad para
  entrar a un tenant concreto. Son decisiones distintas.
- El navegador llama al BFF. El BFF valida el JWT, obtiene el `userId` desde el
  token y comprueba la membresia antes de reenviar una ruta con `tenantId`.
- No confiar en un `userId`, rol o lista de tenants enviados por el frontend.
- Un administrador global puede omitir la membresia solo mediante una regla
  explicita y probada. No convertir automaticamente a un administrador de
  tenant en administrador global.
- Cada consulta y mutacion de dominio queda acotada por `tenantId`. Reforzar el
  aislamiento con relaciones, indices y claves foraneas en PostgreSQL.
- La API interna no se expone al navegador en produccion. El BFF es el limite
  publico de autenticacion y autorizacion.
- Un `401` significa sesion ausente o vencida. Un `403` significa sesion valida
  sin permiso y no debe cerrar la sesion.
- Mantener una sola sesion compartida para las vistas operativas y el control
  global. Evitar contextos de login paralelos.
- Crear migraciones reales y mantener `synchronize=false` en produccion.
- No crear una FK entre bases para `userId`; validar el usuario mediante
  `user-api` y guardar su UUID como identidad externa.

## Implementar por capas

### 1. Identidad y sesion

Reutilizar `/api/auth/login` y `/api/auth/profile` del BFF cuando ya existan.
Definir un modelo pequeno de sesion (`user`, `roles`, `accessToken`) y una sola
fuente de estado React. Restaurar la sesion validando el perfil, no solo
decodificando el JWT localmente.

Centralizar las llamadas autenticadas. Adjuntar `Authorization: Bearer`, limpiar
la sesion al recibir `401` y propagar los demas errores sin ocultarlos.

### 2. Modelo de membresia

Crear una relacion unica `(tenantId, userId)` con estado activo. El tenant puede
tener FK local; `userId` permanece como UUID externo. Agregar una migracion,
registrarla en la configuracion TypeORM y cubrir alta, revocacion, reactivacion
y consulta.

### 3. API interna

Exponer operaciones internas para:

- listar tenants accesibles por usuario;
- comprobar acceso de un usuario a un tenant;
- listar, otorgar y revocar membresias.

Estas rutas sirven al BFF y no sustituyen su autorizacion publica.

### 4. BFF

Aplicar `JwtAuthGuard` antes de cualquier operacion protegida. En rutas con
`tenantId`, aplicar un guard de tenant que use el `userId` autenticado. Filtrar
tambien la lista de tenants; proteger solo la ruta de detalle no basta.

Aplicar `RolesGuard` a la administracion global y a las mutaciones de
configuracion que correspondan. Mantener disponibles las operaciones de
dominio autorizadas para miembros normales.

### 5. Frontend

Proteger rutas con componentes de acceso y usar un parametro `redirect`
validado para volver a la pantalla solicitada despues del login. Mostrar solo
los tenants devueltos por el BFF. Ocultar navegacion sin permiso mejora la UX,
pero nunca reemplaza los guards del servidor.

En el control global, permitir que un administrador consulte usuarios y cambie
su acceso por tenant. No conceder acceso automaticamente al crear un tenant a
menos que exista una regla de negocio explicita.

## Validar

Agregar pruebas significativas para servicios, guards y controladores. Como
minimo demostrar:

1. una llamada anonima devuelve `401`;
2. un miembro ve solo sus tenants;
3. un miembro puede operar su tenant;
4. el mismo miembro recibe `403` en un tenant ajeno;
5. otorgar acceso habilita la operacion;
6. revocar acceso vuelve a bloquearla;
7. un usuario normal no entra al control global;
8. el administrador global conserva el acceso definido por el producto;
9. el frontend restaura sesion y maneja expiracion;
10. la migracion sube y baja sin depender de `synchronize`.

Ejecutar typecheck, lint, tests y builds de los proyectos afectados. Si cambia
Compose, validar su configuracion y la salud de los servicios. Limpiar usuarios
y membresias temporales creados por pruebas funcionales.

## Documentar el resultado

Actualizar las reglas de negocio del producto y registrar:

- roles vigentes y su alcance;
- quien puede administrar tenants y membresias;
- endpoints publicos e internos;
- ubicacion de la migracion;
- forma de almacenar el token y riesgos pendientes;
- pruebas ejecutadas y limitaciones conocidas.

Cerrar el trabajo explicando el recorrido completo
`login -> JWT -> BFF -> membresia -> API -> PostgreSQL -> frontend` y señalar
los archivos modificados.

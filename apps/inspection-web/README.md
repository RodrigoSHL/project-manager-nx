# GridAssets

Esqueleto visual de una aplicación para gestión de subestaciones y activos.

Las reglas funcionales y técnicas vigentes se mantienen en
[`docs/INSPECTION_RULES.md`](../../docs/INSPECTION_RULES.md).

## Ejecutar

Desde la raíz del monorepo:

```bash
npm install
docker compose up -d postgres
npx nx serve user-api
npx nx serve inspection-api
npx nx serve bff-api
npx nx serve inspection-web
```

Abrir `http://localhost:4204`.

Los cuatro comandos `nx serve` deben permanecer ejecutándose, cada uno en su
propia terminal. `user-api` autentica tanto la operación como la administración
de plataforma. En desarrollo, `docker-compose.yml` publica PostgreSQL en
`localhost:5432`. `docker-compose.prod.yml` mantiene la base y las APIs dentro
de la red privada de Docker y no debe mezclarse con procesos Nx locales.

## Alcance actual

- Login real conectado al BFF, restauración de sesión mediante
  `/api/auth/profile` y cierre automático cuando el JWT expira.
- Layout responsive con sidebar en escritorio y menú lateral en móvil.
- Navegación con React Router.
- Dashboard con valores escritos directamente en el frontend.
- Módulo de Activos conectado al BFF, con selector de tenant y sitio, árbol jerárquico, búsqueda y detalle.
- Datos iniciales para 2 tenants, 4 sitios y más de 15 activos por tenant, almacenados en PostgreSQL.
- Módulo de Trabajos conectado al BFF, con creación desde un activo, filtros,
  captura parcial, inicio y finalización validada.
- Administración global de clientes en `/platform/tenants`, con listado,
  búsqueda, creación, edición, activación, métricas y asignación de usuarios.
- Página visual para Hallazgos.
- Administración jerárquica de activos con árbol, alta contextual, edición,
  búsqueda, cambio de estado y eliminación protegida cuando existen hijos.
- Centro de Administración con rutas separadas para Activos, Tipos de activos,
  Tipos de trabajo, Sitios y Usuarios.
- Mantenedores de tipos de activo y tipos de trabajo conectados al BFF, con
  creación, edición y activación/desactivación aisladas por tenant.
- Relaciones persistidas entre tipos de activo y tipos de trabajo, con
  asociación y desasociación desde Administración.
- Excepciones por activo con tres opciones: heredar, permitir o bloquear. La API
  calcula la lista efectiva que muestra la ficha.
- Catálogo de 15 conceptos iniciales por tenant persistido en PostgreSQL, con
  CRUD, filtros, opciones digitales y asociación N:M con tipos de activo.
- Ficha de activo con conceptos disponibles resueltos desde su tipo, todavía
  sin captura de valores.
- Constructor básico de plantillas dentro de Tipos de trabajo, con secciones,
  tareas, referencias a conceptos, orden mediante botones y vista previa
  dinámica. Las plantillas se almacenan en PostgreSQL mediante el BFF.
- Componentes reutilizables `Button`, `Sheet`, `PageHeader` y `EmptyState`.

No existen todavía almacenamiento local, Service Worker, sincronización,
hallazgos ni pautas reales. Los catálogos, plantillas, trabajos y respuestas se
almacenan en PostgreSQL a través de `inspection-api` y el BFF, por lo que se
conservan al refrescar el navegador.

## Estructura

```text
src/
├── app/          # Componente raíz y estado temporal del login
├── routes/       # Relación entre URL y página
├── layouts/      # Estructura compartida: sidebar, cabecera y contenido
├── pages/        # Una pantalla por ruta
├── features/     # Código agrupado por módulo funcional
│   ├── auth/         # Sesión JWT compartida, perfil y cliente HTTP autenticado
│   ├── assets/       # Cliente BFF, modelos, formularios, árbol y detalle
│   ├── asset-types/  # Modelo y consultas del catálogo de tipos de activo
│   ├── catalogs/     # Carga remota de catálogos administrativos
│   ├── concepts/     # Cliente BFF, modelos, caché UI y componentes de conceptos
│   ├── form-templates/ # Cliente BFF, modelos, caché UI, editor y vista previa
│   ├── platform/     # Cliente BFF y gestión global de tenants
│   ├── work-types/   # Modelos y componentes de tipos de trabajo permitidos
│   └── works/        # Cliente BFF, ejecución de formularios y caché de pantalla
├── components/   # Componentes visuales reutilizables
│   └── ui/       # Primitives compatibles con shadcn/ui
├── lib/          # Funciones pequeñas compartidas
├── assets/       # Imágenes o archivos estáticos futuros
├── main.tsx      # Punto de entrada de React
└── styles.css    # TailwindCSS y estilos globales mínimos
```

El JWT sigue el patrón vigente de `project-web` y `jira-web`: se conserva en
`localStorage`, se valida contra el BFF al refrescar y se adjunta a las llamadas
HTTP. Un administrador global puede acceder a todos los tenants; un usuario
normal solo recibe los tenants que tiene asignados en Control global.

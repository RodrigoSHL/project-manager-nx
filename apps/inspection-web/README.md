# GridAssets — etapa 2

Esqueleto visual de una aplicación para gestión de subestaciones y activos.

Las reglas funcionales y técnicas vigentes se mantienen en
[`docs/INSPECTION_RULES.md`](../../docs/INSPECTION_RULES.md).

## Ejecutar

Desde la raíz del monorepo:

```bash
npm install
docker compose up -d postgres
npx nx serve inspection-api
npx nx serve bff-api
npx nx serve inspection-web
```

Abrir `http://localhost:4204`.

Los tres comandos `nx serve` deben permanecer ejecutándose, cada uno en su
propia terminal. En desarrollo, `docker-compose.yml` publica PostgreSQL en
`localhost:5432`. `docker-compose.prod.yml` mantiene la base y las APIs dentro
de la red privada de Docker y no debe mezclarse con procesos Nx locales.

## Alcance actual

- Login simulado; no valida ni persiste credenciales.
- Layout responsive con sidebar en escritorio y menú lateral en móvil.
- Navegación con React Router.
- Dashboard con valores escritos directamente en el frontend.
- Módulo de Activos conectado al BFF, con selector de tenant y sitio, árbol jerárquico, búsqueda y detalle.
- Datos iniciales para 2 tenants, 4 sitios y más de 15 activos por tenant, almacenados en PostgreSQL.
- Páginas visuales para Trabajos y Hallazgos.
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
  dinámica. Las plantillas son mock y viven solamente durante la sesión.
- Componentes reutilizables `Button`, `Sheet`, `PageHeader` y `EmptyState`.

No existen todavía almacenamiento local, Service Worker, sincronización,
trabajos ni pautas reales. Los catálogos de activos, tipos de trabajo y
conceptos se almacenan en PostgreSQL a través de `inspection-api` y el BFF. Las
plantillas de formulario de esta iteración se mantienen en memoria: al
refrescar el navegador vuelven a sus datos mock iniciales.

## Estructura

```text
src/
├── app/          # Componente raíz y estado temporal del login
├── routes/       # Relación entre URL y página
├── layouts/      # Estructura compartida: sidebar, cabecera y contenido
├── pages/        # Una pantalla por ruta
├── features/     # Código agrupado por módulo funcional
│   ├── assets/       # Cliente BFF, modelos, formularios, árbol y detalle
│   ├── asset-types/  # Modelo y consultas del catálogo de tipos de activo
│   ├── catalogs/     # Carga remota de catálogos administrativos
│   ├── concepts/     # Cliente BFF, modelos, caché UI y componentes de conceptos
│   ├── form-templates/ # Modelos, mocks, estado UI, editor y vista previa
│   └── work-types/   # Modelos y componentes de tipos de trabajo permitidos
├── components/   # Componentes visuales reutilizables
│   └── ui/       # Primitives compatibles con shadcn/ui
├── lib/          # Funciones pequeñas compartidas
├── assets/       # Imágenes o archivos estáticos futuros
├── main.tsx      # Punto de entrada de React
└── styles.css    # TailwindCSS y estilos globales mínimos
```

El login se guarda solamente en memoria con `useState`. Al refrescar el
navegador se vuelve a `/login`; esto sigue siendo un acceso simulado, sin
autenticación multi-tenant real.

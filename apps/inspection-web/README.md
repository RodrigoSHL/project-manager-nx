# GridAssets — etapa 2

Esqueleto visual de una aplicación para gestión de subestaciones y activos.

## Ejecutar

Desde la raíz del monorepo:

```bash
docker compose -f docker-compose.prod.yml up -d --build postgres inspection-api bff-api
npx nx serve inspection-web
```

Abrir `http://localhost:4204`.

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
- Catálogos mock/locales de tipos de activo y tipos de trabajo, aislados por
  tenant y disponibles en modo de solo lectura.
- Relación local entre tipos de activo y tipos de trabajo, con excepciones por
  activo. La ficha del activo muestra la lista efectiva permitida.
- Componentes reutilizables `Button`, `Sheet`, `PageHeader` y `EmptyState`.

No existen todavía almacenamiento local, Service Worker, sincronización,
trabajos ni pautas reales. Los nuevos catálogos y relaciones son mocks del
frontend. El formulario de activos existente sí persiste sus cambios a través
de la API y PostgreSQL; un adaptador temporal convierte `assetTypeId` al campo
`type` que aún espera esa API, sin modificar el backend en esta etapa.

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
│   └── work-types/   # Modelos, resolución de reglas y componentes de lectura
├── components/   # Componentes visuales reutilizables
│   └── ui/       # Primitives compatibles con shadcn/ui
├── lib/          # Funciones pequeñas compartidas
├── assets/       # Imágenes o archivos estáticos futuros
├── mocks/        # Catálogos y relaciones locales de esta etapa
├── main.tsx      # Punto de entrada de React
└── styles.css    # TailwindCSS y estilos globales mínimos
```

El login se guarda solamente en memoria con `useState`. Al refrescar el
navegador se vuelve a `/login`; esto sigue siendo un acceso simulado, sin
autenticación multi-tenant real.

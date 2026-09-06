# GridAssets — etapa 2

Esqueleto visual de una aplicación para gestión de subestaciones y activos.

## Ejecutar

Desde la raíz del monorepo:

```bash
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
- Páginas vacías para Trabajos, Hallazgos y Administración.
- Componentes reutilizables `Button`, `Sheet`, `PageHeader` y `EmptyState`.

No existen almacenamiento local, Service Worker, sincronización, trabajos,
pautas, hallazgos ni formularios reales.

## Estructura

```text
src/
├── app/          # Componente raíz y estado temporal del login
├── routes/       # Relación entre URL y página
├── layouts/      # Estructura compartida: sidebar, cabecera y contenido
├── pages/        # Una pantalla por ruta
├── features/     # Código agrupado por módulo funcional
│   └── assets/   # Modelos, datos mock, filtros, árbol y detalle de activos
├── components/   # Componentes visuales reutilizables
│   └── ui/       # Primitives compatibles con shadcn/ui
├── lib/          # Funciones pequeñas compartidas
├── assets/       # Imágenes o archivos estáticos futuros
├── main.tsx      # Punto de entrada de React
└── styles.css    # TailwindCSS y estilos globales mínimos
```

El login se guarda solamente en memoria con `useState`. Al refrescar el
navegador se vuelve a `/login`; esto es intencional en esta primera etapa.

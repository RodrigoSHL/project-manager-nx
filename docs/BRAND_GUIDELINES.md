# Identidad de las aplicaciones AtomDev

## Dirección común

Cada producto conserva su nombre y un símbolo propio. La familia se reconoce por
la misma base azul oscuro, la geometría del icono y la composición de la marca.
AtomDev conserva su logo corporativo como marca de la empresa.

- Base de los iconos: `#0f172a`, cuadrado con esquinas redondeadas.
- Fuente del icono: SVG cuadrado con `viewBox="0 0 512 512"` y radio `104`.
- Símbolo simple, centrado y reconocible a 16 y 32 px, con un acento por producto.
- Marca en navegación: icono de 36 px, nombre al lado y separación consistente.
- El mismo SVG se usa en navegación, login y pestaña. Los PNG se generan desde él.
- Tipografía propuesta para las interfaces: Inter; nombres de producto con peso 600.
- Títulos de pestaña: `Nombre del producto | Descripción breve`, en español.
- El icono conserva sus colores en los temas claro y oscuro para facilitar su reconocimiento.

## Productos

| Producto | Símbolo | Acento | Estado |
| --- | --- | --- | --- |
| GridAssets | Rayo | Amarillo `#fbbf24` | Aplicado |
| Travel Planner | Marcador de ubicación | Celeste `#38bdf8` | Aplicado |
| ProjectHub | Carpeta | Verde `#34d399` | Aplicado |
| FlowBoard | Tablero | Violeta `#a78bfa` | Aplicado |

## Fuentes y regeneración

- GridAssets: `apps/inspection-web/public/gridassets-icon.svg`.
  Regenerar con `node scripts/generate-gridassets-icons.mjs`.
- Travel Planner: `apps/travel-planner-app/public/travel-planner-icon.svg`.
  Regenerar con `node scripts/generate-travel-planner-icons.mjs`.
- ProjectHub: `apps/project-web/public/projecthub-icon.svg`.
- FlowBoard: `apps/jira-web/public/flowboard-icon.svg`.
  Regenerar ambos con `node scripts/generate-project-brand-icons.mjs`.
- ProjectHub mantiene `app/favicon.ico` como alternativa compatible; FlowBoard
  mantiene `public/icon.svg` como alias actualizado de su SVG de marca.
- Los iconos Apple tienen fondo opaco y margen para la máscara de la plataforma.
- Los iconos de GridAssets instalable conservan su variante con área segura.

## Siguiente etapa

Compartir en una librería Nx los componentes de marca y los valores comunes de
tipografía, espacios, radios, botones y formularios. Cada app debe configurar
únicamente su nombre, símbolo y acento. Esta etapa aún no está implementada:
las cuatro aplicaciones ya comparten la línea de marca, mientras sus pantallas
operativas conservan sus diseños actuales.

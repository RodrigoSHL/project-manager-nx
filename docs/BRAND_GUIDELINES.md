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
| ProjectHub | Carpeta | Verde `#54b8a0` (RGB 84, 184, 160) | Aplicado |
| FlowBoard | Tablero | Violeta `#a78bfa` | Aplicado |

## Detalles amarillos de GridAssets

GridAssets conserva el rayo amarillo `#fbbf24` y su base azul oscuro. El amarillo
se usa de forma discreta en la navegación activa, los indicadores de marca y el
foco de teclado. Las acciones principales mantienen superficies neutras y los
avisos conservan sus colores semánticos.

| Uso | Tema claro | Tema oscuro |
| --- | --- | --- |
| Texto de marca en login | `#92400e` | `#fcd34d` |
| Selección móvil | Fondo `#fffbeb`, texto `#78350f` | Amarillo translúcido, texto `#fcd34d` |
| Navegación lateral activa | Amarillo translúcido, texto `#fcd34d` | Amarillo translúcido, texto `#fcd34d` |
| Foco de teclado | `#b45309` | `#fcd34d` |

El login y la aplicación operativa ofrecen selector de tema. La preferencia se
guarda en `gridassets-theme`; al entrar por primera vez se sigue el tema del
sistema. Tablas, formularios, gráficos y avisos adaptan sus fondos y textos. La
navegación lateral conserva su fondo oscuro en ambos temas.

El estado inicial de conexión se presenta como «Comprobando conexión», con una
segunda comprobación si falla el primer intento. El aviso de servidor no
disponible aparece después de la comprobación y permite reintentar desde el login.

## Detalles verdes de ProjectHub

ProjectHub usa verde en acciones principales, enlaces, foco de teclado y
selecciones, acompañado de fondos suaves en la navegación y avisos. Los fondos
principales se mantienen neutros y los estados conservan sus colores semánticos.

| Uso | Tema claro | Tema oscuro |
| --- | --- | --- |
| Fondo de acción | `#54b8a0` | `#54b8a0` |
| Texto sobre acción | `#052e24` | `#052e24` |
| Enlace y texto de marca | `#176956` | `#54b8a0` |
| Fondo de selección | `#eef8f5` | `#12352d` |
| Texto de selección | `#176956` | `#a6dfd0` |

El login comparte esta paleta y ofrece un selector de tema. El verde principal
es el RGB 84, 184, 160 elegido por el usuario. El texto oscuro sobre ese verde
alcanza 6,14:1 de contraste; los enlaces usan un tono más oscuro en modo claro,
porque el verde principal sobre blanco solo alcanza 2,40:1. Las combinaciones de
texto y los estados hover mantienen al menos 4,5:1 de contraste.

## Detalles violetas de FlowBoard

FlowBoard extiende el violeta de su tablero a las acciones principales, enlaces,
foco de teclado, selección de proyecto y navegación. El login y el portal de
soporte comparten el mismo logo y ofrecen selector de tema. Los estados de los
tickets y los colores configurados por proyecto conservan su significado.

| Uso | Tema claro | Tema oscuro |
| --- | --- | --- |
| Fondo de acción | `#a78bfa` | `#a78bfa` |
| Texto sobre acción | `#21143d` | `#21143d` |
| Enlace y texto de marca | `#6d28d9` | `#c4b5fd` |
| Fondo de selección | `#f3efff` | `#272039` |
| Texto de selección | `#6d28d9` | `#ddd6fe` |

El texto oscuro sobre la acción alcanza 6,26:1 de contraste. El violeta claro
del logo se reserva para fondos e iconos; los textos usan `brand-foreground`
para mantener contraste en superficies claras. Las selecciones alcanzan
6,29:1 en modo claro y 11,19:1 en oscuro.

## Detalles celestes de Travel Planner

Travel Planner usa el celeste de su marcador en acciones, enlaces, foco de teclado
y selecciones. Los encabezados de itinerario, divisas, equipaje y perfil comparten
un mismo fondo azul oscuro. Las tarjetas de divisas y categorías de actividad,
gastos y equipaje usan fondos suaves, identificadas por sus iconos y nombres.

| Uso | Tema claro | Tema oscuro |
| --- | --- | --- |
| Fondo de acción | `#38bdf8` | `#38bdf8` |
| Texto sobre acción | `#082f49` | `#082f49` |
| Enlace y texto de marca | `#075985` | `#7dd3fc` |
| Fondo de selección | `#edf9ff` | `#102c3d` |
| Texto de selección | `#075985` | `#bae6fd` |

La acción alcanza 6,48:1 de contraste; las selecciones alcanzan 7,06:1 en claro
y 10,92:1 en oscuro. Los colores de alertas y estados, las franjas de países del
calendario y los colores personales de las maletas conservan su significado.
Login, registro y perfil ofrecen selector de tema.

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

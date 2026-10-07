# GridAssets: estrategia comercial y fundamento de precios

Revisión comercial: 6 de octubre de 2026. Documento interno de AtomDev; la cotización
para presentar al cliente está en
[`GRIDASSETS_COTIZACION_MODELO_OCT_2026.md`](./GRIDASSETS_COTIZACION_MODELO_OCT_2026.md).

## Decisión comercial para revisar

Mantener las entradas de **10 y 15 UF mensuales + IVA** y los alcances
publicados: una faena autogestionada en 10 UF; hasta tres faenas, primera
pauta guiada, dos sesiones iniciales y revisión mensual de 30 min en 15 UF.
Acotar usuarios y almacenamiento en la cotización como supuestos propuestos,
sin atribuirles límites publicados que la landing no indica. Sustituir la opción de 19 UF por
**Corporativo a 30 UF mensuales + IVA**. El cliente estima cuatro
faenas y unos diez usuarios técnicos; la propuesta de 30 UF contempla hasta
cinco faenas y quince usuarios totales, para dar espacio a supervisores y
administradores. Confirmar esas cuentas antes de emitir la oferta.

Los planes de entrada deben resolver una operación pequeña real. La
progresión se sostiene en alcance y acompañamiento; no en ocultar funciones
básicas, limitar la corrección de fallas o prometer funciones que aún no
existen. El plan de 30 UF es una hipótesis comercial que debe validarse con
costos y aceptación del cliente, no un precio de mercado demostrado.

| Opción | Mensualidad neta | Faenas | Usuarios nominativos | Inventario de referencia, incluidos descendientes | Evidencia acumulada propuesta | Acompañamiento recurrente |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Básico | 10 UF | 1 | 3 | 500 registros | 5 GB | Sin sesiones periódicas; configuración a cargo del cliente |
| Multifaena | Desde 15 UF | Hasta 3 | 5 | 1.500 registros | 10 GB | Primera pauta guiada, dos sesiones iniciales de 60 min y revisión mensual de 30 min |
| Corporativo | 30 UF | Hasta 5 | 15 | Inventario real a dimensionar antes de contratar | 40 GB | Revisión mensual de 60 min y una hora trimestral de optimización de la configuración |

La progresión comercial es **1, 3 y 5 faenas**. Los usuarios, evidencias,
inventario de referencia y horas son totales del plan, compartidos entre sus
faenas; no se multiplican por sitio. Los GB son capacidad acumulada, no
mensual. Todos los planes incluyen las funciones actuales de activos,
pautas, trabajos, hallazgos, informes y analítica, el alojamiento y operación
SaaS en infraestructura compartida y la corrección de defectos del producto.
La política concreta de respaldo y atención debe acordarse y comprobarse.
No ofrecer un SLA especial o infraestructura exclusiva por el precio estándar.

Cobrar por la unidad de operación y capacidad de servicio, no por cada
componente del árbol, respuesta o fotografía. Un activo hijo debe poder
existir sin disparar otra licencia. El inventario es una referencia de
dimensionamiento, no un contador de facturación. Una faena es un sitio
operacional dentro de la misma empresa/tenant: sus áreas, subestaciones y
componentes no son faenas adicionales. Las cuentas deben ser personales.
Los límites comerciales todavía no se aplican automáticamente en el producto.

### Servicios iniciales y ampliaciones

- Básico: sin implementación obligatoria si el cliente configura sus datos.
  Carga o parametrización asistida se cotizan por alcance.
- Multifaena: preparación inicial **opcional de 8 UF una vez** para configurar
  hasta tres sitios, cargar hasta 100 registros listos para cargar y comprobar
  el primer flujo. La primera pauta guiada y las dos sesiones iniciales de
  60 min ya están incluidas en el alcance publicado de la suscripción; no
  duplicarlas en el cargo inicial. Mantener los 30 min mensuales publicados.
- Corporativo: preparación inicial de **12 UF una vez** para hasta
  cinco sitios y una muestra de arranque de hasta 250 registros entregados
  en formato acordado y listos para cargar, guía de
  configuración de dos pautas existentes, portada estándar del informe y
  tres sesiones remotas de 60 min en total. No incluye construir pautas desde
  documentos sin estructurar, limpiar datos extensamente, desarrollar
  reportes a medida ni capacitar por separado cada faena. Los 250 registros
  son totales y no representan el inventario completo de las faenas.
- En Corporativo, las tres sesiones iniciales están dentro de la preparación
  de 12 UF. En Multifaena, las dos sesiones publicadas pertenecen al alcance
  de la suscripción. No duplicar cargos. Las revisiones periódicas se financian
  en la mensualidad de cada plan; no se acumulan ni incluyen código nuevo o
  correcciones manuales por errores de carga del cliente.
- Mantener **0,5 UF/mes por usuario adicional**, previa validación, y la
  propuesta de **1 UF/mes por 10 GB adicionales** únicamente después de
  comprobar capacidad y respaldos. Estos adicionales no amplían faenas ni
  incorporan acompañamiento. No aplicar cargos automáticos o retroactivos.
- Para cuatro o cinco faenas, ofrecer Corporativo. Para más de cinco,
  varias empresas legales, infraestructura exclusiva o servicio especial,
  cotizar el despliegue específico. No ofrecer faenas o usuarios ilimitados
  por 30 UF ni multiplicar automáticamente el precio de un sitio.
- Si se migra desde Multifaena con preparación asistida ya pagada, abonar sus
  8 UF a las 12 UF del nuevo alcance y cobrar solo 4 UF adicionales. Sin
  preparación previa, corresponde el cargo de 12 UF. La nueva mensualidad
  rige desde el período acordado.

La importación masiva desde Excel no está identificada como función existente;
la carga asistida es trabajo operativo de AtomDev. Revisar calidad del archivo
y estimar las horas antes de confirmar el cargo inicial. Los 8 y 12 UF son
precios propuestos para un alcance acotado, no una tarifa fija para cualquier
implementación. Si el trabajo excede lo descrito, cotizarlo como proyecto.

### Inventario observado y reconstrucción manual

Las capturas aportadas el 6 de octubre muestran 28 subestaciones principales
y 75 secundarias visibles. Una rama expandida permite proyectar alrededor de
70 registros por subestación si se repite su estructura: 103 × 70 = 7.210.
Es una extrapolación, no un conteo del inventario completo. El cliente indica
que las secundarias son similares; falta expandir y verificar las ramas.
Las entradas obsoletas o sin acceso deben clasificarse con el cliente.
No trasladar esta dotación estimada al alcance de la propuesta pública.

Se retira la referencia de 5.000 registros para Corporativo. La capacidad
debe dimensionarse con el inventario real y el volumen de trabajos y
evidencias. Mantener 30 UF como precio propuesto sujeto a esa evaluación;
el conteo de activos no demuestra por sí solo el costo recurrente del servicio.

El usuario confirma que el origen no permite exportar y habría que
reconstruirlo. Cotizar un proyecto separado de reconstrucción, preparación,
carga y validación del inventario. La carga de arranque incluida en 12 UF
requiere datos listos: reconstruir incluso la muestra requiere presupuesto
adicional. Excluir del precio de migración el trabajo de carga ya cubierto
por esos 250 registros para no cobrarlo dos veces.

Antes de fijar el importe, medir una muestra de 50–100 registros
representativos, incluyendo agrupadores y componentes con distintas
profundidades. Acordar y presupuestar esa etapa de diagnóstico antes de
ejecutarla. Registrar tiempo de transcripción, armado de relaciones,
verificación y corrección; luego estimar por lotes la reconstrucción restante,
sumando revisión y validación del cliente. No inventar un costo por registro
ni usar solo tiempo de tecleo. Si se requiere construir un importador,
presupuestar ese desarrollo explícitamente; no afirmar que ya existe.

El piloto se inicia con una muestra acordada, luego de configurar y validar
una pauta, trabajo, sincronización e informe. Su fecha de activación se
acuerda con el cliente y la reconstrucción completa tiene un calendario
propio. Los 72 UF del piloto y 372 UF del primer año no incluyen el proyecto
de reconstrucción y migración.

“Desde 10 UF” y “desde 15 UF” deben corresponder a configuraciones reales y
accesibles con el alcance publicado. Las cuatro faenas no caben en esos
planes de entrada. La sustitución de 19 por 30 UF es una revisión explícita
del borrador y de sus precios; no atribuirla a un servicio adicional que ya
estaba incluido. No modificar retrospectivamente condiciones aceptadas.

## Investigación de mercado: señales útiles, no equivalencias directas

| Proveedor y fuente oficial | Modelo/precio publicado observado | Lectura para GridAssets |
| --- | --- | --- |
| [UpKeep](https://upkeep.com/pricing/) | Essential USD 24/usuario/mes, Premium USD 55/usuario/mes; el modo offline móvil aparece en Professional, que requiere cotización. | No comparar 15 UF con diez licencias Premium como si incluyeran el mismo offline. Sirve para mostrar cómo el cobro por usuario crece al escalar. |
| [Fiix](https://fiixsoftware.com/cmms/pricing/) | Basic USD 45/usuario/mes; Professional USD 75/usuario/mes e incluye gestión multisede. Diez usuarios Professional serían USD 750/mes a precio de lista. | Referencia internacional de precio por usuario; el alcance funcional es distinto. |
| [DataScope](https://conoce.datascope.io/precios) | Usuarios ilimitados, cobro por acciones y límites publicados de activos por plan; ofrece operación offline. | Competidor de formularios de terreno. No afirmar que GridAssets es el único offline ni que es siempre más barato. |
| [Fracttal](https://www.fracttal.com/es/consultar-precios-fracttal) | EAM/CMMS con modo offline; cotización personalizada, sin tarifa pública comparable. | Competidor funcional importante, incluso en entornos industriales. |
| [headQ](https://headq.cl/software-mantenimiento/) | Precio plano desde CLP 79.000 y hasta CLP 549.000/mes según puntos operativos y usuarios publicados. | Presiona por precio en Chile, pero un “punto operativo” no equivale necesariamente a la jerarquía completa de activos o a una faena. |
| [MacroSens OPS](https://ops.macrosens.com/) | Precio publicado por activo y usuarios ilimitados. | Refuerza el valor de no penalizar un inventario detallado; comprobar el precio vigente antes de usar una cifra puntual. |

**Inferencia comercial:** las referencias muestran modelos distintos, no
un precio correcto único para GridAssets. La propuesta de 30 UF requiere
comprobar el valor de coordinar cuatro faenas, preparar informes y recuperar
la trazabilidad, además de cubrir la operación y el acompañamiento. No hay
evidencia aún de aceptación del precio ni de horas ahorradas. No presentar
como exclusiva la capacidad offline.

## Economía de la oferta

| Opción | Suscripción anual neta | Preparación inicial propuesta | Primer año neto con esa preparación | Presupuesto mensual de costo directo para una meta de 70% de margen bruto |
| --- | ---: | ---: | ---: | ---: |
| Básico | 120 UF | A cotizar si se solicita | 120 UF más el servicio acordado | 3 UF |
| Multifaena | 180 UF | 8 UF opcionales | 188 UF si se contrata | 4,5 UF |
| Corporativo | 360 UF | 12 UF | 372 UF | 9 UF |

Todos los importes comerciales son más IVA, sujeto al tratamiento tributario
aplicable. Se factura en pesos según la UF y fecha pactadas. No confundir IVA
con ingreso o margen de AtomDev.

El 70% es una **meta interna**, no un estándar obligatorio ni un margen ya
observado. El costo directo debe incluir infraestructura asignada, base de
datos, almacenamiento, respaldos externos, monitoreo, operación, atención de
incidentes, corrección de defectos y horas del acompañamiento contratado.
Valorar el tiempo del propio desarrollador aunque no haya una factura; las
1 UF/hora de soporte y 1,5 UF/hora de desarrollo son precios de venta, no el
costo interno de esas horas. Separar del margen los servicios adicionales
facturados al cliente. El remanente debe financiar desarrollo del producto,
ventas, administración y utilidad.

Piso por costo directo: **mensualidad = costo directo / (1 − margen bruto
objetivo)**. A modo hipotético, 6 UF de costo mensual requieren 20 UF de precio
para un margen de 70%; 9 requieren 30 y 12 requieren 40. Ninguno de esos
costos está medido todavía. Estimar el piloto y registrar horas, ocupación,
crecimiento y costos reales antes de confirmar capacidad y precio.

La plataforma e infraestructura reutilizables son inversión compartida entre
clientes y deben recuperarse con las suscripciones. El trabajo de alta,
configuración, carga y capacitación de este cliente se financia en la
preparación inicial. Si se requiere infraestructura dedicada, cotizar sus
costos y operación específicamente. No trasladar todo el costo del producto
al primer cliente ni excluirlo de la economía del negocio.

Ejemplo para dimensionar evidencias: **180 trabajos/mes × 4 fotos × 2 MB =
1,44 GB/mes**, alrededor de **17,3 GB en doce meses** sin contar metadatos ni
copias de respaldo. Si las fotos promedian 5 MB, el mismo uso llega a **43,2
GB/año**. Con ese uso agregado, 5 y 10 GB cubrirían alrededor de 3,5 y
6,9 meses si las fotos promedian 2 MB, y 40 GB no cubrirían un año completo
si promedian 5 MB. Validar cada capacidad con una muestra real de la empresa.
Al 70% de la capacidad acordada, avisar; al 90%, acordar ampliación antes de
que se alcance el límite. Nunca descartar evidencias ni cobrar sobreconsumo
sin acuerdo. Una vez exista un límite técnico, detener únicamente nuevas
cargas de archivos al alcanzarlo y mantener accesibles trabajos y evidencias
previas. **Ese comportamiento todavía no está implementado.**

Actualmente, Files API guarda contenido en PostgreSQL (`bytea`) por defecto y
permite archivos de hasta 10 MB. No existe en el producto un medidor/cuota de
almacenamiento por tenant ni enforcement de usuarios, activos o faenas por
plan. Si el almacenamiento físico se agota hoy, pueden fallar cargas y otros
procesos de la base: **no existe un corte seguro al llegar a los GB
propuestos**. Antes de firmar un compromiso de capacidad, medir espacio
efectivo, respaldos y restauración, implementar al menos conteo y alertas por
tenant, y acordar una política segura de nuevas cargas. Una
eventual migración a almacenamiento de objetos es una decisión técnica futura,
no una prestación ya disponible. La [tarifa pública de Cloudflare R2](https://developers.cloudflare.com/r2/pricing/)
puede servir para evaluar una arquitectura posterior, pero no es el costo
actual del sistema.

## Mejoras, desarrollos y soporte operativo

| Tipo de encargo | Tarifa neta | Criterio de clasificación |
| --- | ---: | --- |
| Mejora o desarrollo | **1,5 UF/hora + IVA** | Agrega o modifica capacidades: funciones, reportes, módulos, flujos o integraciones. |
| Soporte operativo | **1 UF/hora + IVA** | Corrige errores de uso o de carga del cliente mediante intervención manual en el sistema o en la base de datos, dentro de las capacidades existentes. |
| Corrección de defecto del producto | Cubierta por la suscripción | Restablece el comportamiento acordado de una función que falla por un defecto del producto. |

AtomDev desarrolla GridAssets y puede construir reportes, mejoras, módulos e
integraciones solicitados por el cliente. La suscripción paga el acceso y la
operación de las funciones existentes; **no incluye un número ilimitado de
horas de desarrollo**. Corregir defectos respecto del comportamiento acordado
no debe transformarse en una nueva cotización.
Si el pedido se resuelve con la configuración actual de pautas o portada,
tratarlo como parametrización y comprobar primero el alcance incluido en el
plan; presupuestar previamente cualquier alcance adicional.

Tarifa sugerida de referencia: **1,5 UF por hora de trabajo + IVA**. A la UF
del 04-10-2026 son cerca de **CLP 61.635 netos por hora**. La tarifa de
**1 UF/hora + IVA corresponde al soporte operativo**; mantener la referencia
de 1,5 UF/hora para mejoras y desarrollos. No ofrecer **0,5 UF/hora** como
tarifa general: equivale a cerca de CLP 20.545 netos y debe
financiar análisis, implementación, pruebas, reuniones, despliegue y
correcciones.

La referencia no es una tarifa universal del mercado. [OSIS publica 2 UF/hora
para desarrollos a medida](https://www.osis.cl/index.html) y [Nullside publica
un rango de 1 a 2 UF/hora](https://nullside.cl/). Son proveedores y contratos
diferentes, pero muestran que 1,5 UF/hora es una referencia comercial
defendible. No comparar el precio de un perfil contratado a tiempo completo
directamente con un proyecto puntual que incluye gestión y riesgo.

Para el cliente, **cotizar por alcance y precio total fijo** después de una
conversación breve: datos que utilizará, diseño de salida, criterios de
aceptación, estimación de horas, plazo y costo total en UF. El cálculo interno
considera análisis, diseño, código, pruebas, despliegue y documentación; no
solo tiempo escribiendo código. Si el alcance cambia, presentar un adicional
para aprobación antes de ejecutarlo. Ejemplos meramente ilustrativos: una
mejora de 10 horas costaría **15 UF + IVA**; un módulo de 40 horas,
**60 UF + IVA**. La estimación real depende del requerimiento.

En el anexo de cada desarrollo acordar uso y eventual exclusividad, manejo de
datos, validación y una ventana de corrección de defectos del alcance
entregado. Si agrega costos recurrentes de infraestructura, licencias de
terceros o soporte especializado, cotizarlos por separado antes de comenzar.
No prometer exclusividad de un módulo reutilizable ni cesión de todo el código
de GridAssets por el valor de un desarrollo puntual.

### Soporte operativo por errores del cliente

Cobrar **1 UF/hora + IVA** por intervenciones manuales solicitadas a raíz de
errores de uso o de carga del cliente. Ejemplos: datos incorrectos, registros
vinculados a una faena o activo equivocado y estados modificados por error
que requieren rectificación. Puede incluir actualizaciones directas en la
base de datos para corregir la información, así como revisión del caso y
validación del resultado.

Clasificar por el objetivo de la intervención: corregir información o una
situación operativa en funciones existentes es soporte; agregar o cambiar
capacidades es una mejora. El uso de un script o el acceso a la base de datos
no determina por sí solo la tarifa. Confirmar la causa antes de imputar el
caso a un error del cliente; si se debe a un defecto del producto, la
corrección está cubierta por la suscripción.

Informar alcance, horas estimadas e importe en UF antes de comenzar y obtener
la aprobación del cliente. Registrar horas efectivas y resultado; solicitar
un nuevo acuerdo antes de exceder el importe aprobado. Para actualizaciones
directas en la base de datos, conservar un respaldo de los registros afectados
y verificar la corrección. Dos horas de soporte equivalen a **2 UF + IVA**.

Las sesiones y la parametrización ya incluidas en el plan conservan su
alcance; no facturarlas de nuevo como soporte. Separar estas intervenciones
adicionales del costo de soporte recurrente incluido al medir el margen.

## Qué se puede prometer hoy

- Trabajos y respuestas offline **después de preparar la información de la
  faena**, con sincronización al volver la conexión.
- La copia de trabajo incorpora captura local de fotografías y envío durante
  la sincronización. Eso no confirma qué versión está publicada. Validar el
  flujo de evidencias en la versión que se habilite al cliente antes de
  comprometer captura fotográfica offline; la cotización no afirma una
  restricción permanente de fotos solo con conexión.
- Pautas configurables, jerarquía de activos, hallazgos, informes y análisis
  en el alcance actual. Integraciones ERP/SCADA, sensores en tiempo real,
  mantenimiento predictivo y SLA contractual se cotizan solo después de
  evaluación técnica.
- Los tamaños de plan son contractuales/propuestos. El software no restringe
  hoy automáticamente usuarios, faenas, inventario ni GB según precio.

## Forma de vender y validar

1. Presentar **Corporativo a 30 UF/mes + IVA** con hasta cinco faenas y quince
   usuarios totales, sin mencionar la dotación estimada del cliente ni fijar
   una distribución entre técnicos y administradores. Confirmar usuarios, inventario, trabajos al mes,
   fotografías por trabajo, tamaño promedio y retención exigida.
2. Proponer **60 días de piloto pagado** a 30 UF/mes más 12 UF de preparación:
   **72 UF + IVA** en total. Si continúa, no volver a cobrar preparación; los
   dos meses cuentan dentro de una eventual suscripción de doce meses.
   Un piloto Básico o Multifaena debe respetar el alcance menor contratado.
3. Medir tiempo de completar una pauta y publicar el informe, porcentaje de
   trabajos con evidencia completa y facilidad de recuperar el historial.
   Establecer una línea de base antes de prometer ahorros.
4. Mostrar los planes de 10 y 15 UF como opciones útiles para una operación
   menor y autónoma. Para este cliente, explicar el alcance de hasta cinco faenas
   y el acompañamiento; no usar presión ni prometer ilimitados para inducir
   la compra. Cualquier concesión comercial debe conservar el margen.
5. Al cierre del piloto, cotejar costos directos y uso agregado. Si 30 UF no
   financian el alcance, revisar capacidad o cotización antes de comprometer
   una continuidad mayor. Más de cinco faenas o servicio especial requieren
   propuesta específica.

Mantener la landing con una faena desde 10 UF, hasta tres faenas desde 15 UF
con el acompañamiento publicado y Corporativo a medida desde cuatro faenas.
Las 30 UF son la propuesta concreta para este cliente, no un precio universal
para cualquier Corporativo. Usuarios y almacenamiento se dimensionan en la
cotización, como indica la página. **La landing no se modifica ni publica
con esta revisión documental.** Mantener alcances ya aceptados por clientes.

Antes de emitir una cotización vinculante, confirmar capacidad de
infraestructura, respaldos, retención/exportación, tratamiento de datos,
forma de facturación y política de atención con el cliente. La capacidad y
el precio siguen siendo supuestos de esta propuesta comercial.

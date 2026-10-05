# GridAssets: estrategia comercial y fundamento de precios

Revisión: 4 de octubre de 2026. Documento interno de AtomDev; la cotización
para presentar al cliente está en
[`GRIDASSETS_COTIZACION_MODELO_OCT_2026.md`](./GRIDASSETS_COTIZACION_MODELO_OCT_2026.md).

## Decisión recomendada

Ofrecer **Multifaena por 15 UF mensuales + IVA** para un despliegue gradual;
incluye hasta tres faenas de **una misma empresa/tenant** y los diez usuarios
que estima al inicio. Presentar **Multifaena ampliada por 19 UF** como la
elección para operar hasta cinco faenas, sumar personas o manejar
más evidencias, con acompañamiento definido. La opción de 10 UF permanece
para una sola faena. Más de cinco faenas o varios tenants requieren una
cotización corporativa específica. Estas cifras de usuarios y almacenamiento son una **propuesta
comercial**, no límites que el producto aplique hoy.

Cobrar por la **unidad de operación (faenas) y por capacidad de servicio**, no
por cada componente del árbol, respuesta o fotografía. Un activo hijo debe
poder existir para representar fielmente la instalación, sin que su alta
dispare otra licencia. El número de registros del inventario se dimensiona
para preparar la operación, pero no es un contador de facturación.

| Opción | Mensualidad neta | Faenas | Usuarios nominativos | Inventario de referencia, incluidos descendientes | Evidencia acumulada presupuestada | Acompañamiento |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| Una faena | 10 UF | 1 | 5 | 500 registros | 10 GB | Inicio autogestionado |
| Multifaena | 15 UF | Hasta 3 | 10 | 2.500 registros | 20 GB | Primera pauta guiada, dos sesiones iniciales de 60 min y revisión mensual de indicadores de 30 min |
| Multifaena ampliada | 19 UF | Hasta 5 | 20 | 5.000 registros | 40 GB | Dos pautas guiadas, tres sesiones iniciales de 60 min en total, portada estándar configurada, revisión mensual de 60 min en total y una hora trimestral de optimización de la configuración |

Los valores de inventario son **supuestos de capacidad y carga inicial**; no
son topes automáticos ni cargos por registrar un activo más. Los GB son
capacidad total acumulada de archivos, no una cuota mensual renovable. Un
usuario es una persona con cuenta propia activa, compartida entre las faenas
del tenant; no se recomiendan cuentas compartidas. Una faena es un sitio
operacional dentro de un tenant: áreas, subestaciones y componentes dentro de
ese sitio no se cobran como faenas.

La progresión comercial es **1, 3 y 5 faenas**. Usuarios, inventario de
referencia, evidencias y horas de acompañamiento son totales de cada plan,
compartidos entre sus faenas; no se multiplican por sitio. El plan de 19 UF
permite crecer de tres a cinco faenas manteniendo una sola suscripción. Su
capacidad y margen deben validarse con el volumen agregado de las cinco.

### Servicios iniciales y ampliaciones

- Opción de 10 UF: sin cargo obligatorio de implementación cuando el cliente
  configura sus datos. Servicios de carga o parametrización se cotizan aparte.
- Opción de 15 UF: **8 UF una vez** por preparación y carga asistida de hasta
  100 registros de activos entregados en formato acordado, configuración de
  hasta tres sitios y comprobación del primer flujo completo. La primera
  pauta guiada y las dos sesiones de capacitación ya están incluidas en la
  mensualidad de la landing; no duplicar esos servicios en el cargo inicial.
- Opción de 19 UF: **12 UF una vez** por carga asistida de hasta 250 registros,
  configuración de hasta cinco sitios y comprobación de dos flujos. Los 250
  registros y las tres sesiones iniciales son totales del despliegue; no se
  incluye una sesión por faena. La capacitación adicional se cotiza aparte.
  La segunda pauta requiere
  estimar horas si se solicita construcción completa.
- El plan ampliado ofrece más faenas y servicios de adopción, **no funciones del producto
  ocultas en los otros planes**. La hora trimestral cubre parametrización y
  asesoría, no desarrollo de código; no se acumula. La portada del informe se
  configura con la capacidad que ya existe.
- Para cualquier opción, proponer **0,5 UF/mes por cada usuario nominativo
  adicional**. Desde 19 usuarios en el plan de 15 UF, conviene el ampliado de
  19 UF, que incluye 20 cuentas, hasta cinco faenas y más capacidad. Un paquete de **10 GB
  adicionales por +1 UF/mes** solo debe ofrecerse tras verificar capacidad
  y respaldos. No aplicar cargos retroactivos ni por sobrepasos sin acuerdo
  previo. Para cuatro o cinco faenas, ofrecer el ampliado; para seis o más
  faenas o varios tenants, cotizar el despliegue corporativo;
  no multiplicar automáticamente el precio de un sitio.

La importación masiva de activos desde Excel **no está identificada como
función existente**. La carga asistida presupuestada es trabajo operativo de
AtomDev; confirmar previamente la calidad del archivo y horas reales. Si el
catálogo trae miles de registros, cotizar la migración como proyecto separado.

La diferencia entre 19 y 15 UF es **4 UF/mes, 48 UF/año**. Si el cliente
necesita veinte usuarios, diez cuentas adicionales en Multifaena costarían
5 UF/mes: la ampliada ya ahorra 1 UF/mes frente a ese armado y añade
dos faenas adicionales, almacenamiento y servicio. La contrapartida para
AtomDev es el volumen agregado de hasta cinco faenas y tiempo humano:
una sesión extra de arranque, media hora más de revisión mensual, una hora
trimestral y una segunda pauta guiada. Medir las horas reales para mantener
el margen. Si el cliente seguirá con diez personas, pocas fotos y solo una
faena durante meses, no forzar la ampliada; ofrecer mejora de plan cuando
crezca el uso. Durante el piloto, abonar la implementación de 8 UF ya pagada
al cargo de 12 UF del ampliado y cobrar solo 4 UF adicionales si se usa el
alcance extra; aplicar la nueva mensualidad desde el siguiente período
acordado.

## Investigación de mercado: señales útiles, no equivalencias directas

| Proveedor y fuente oficial | Modelo/precio publicado observado | Lectura para GridAssets |
| --- | --- | --- |
| [UpKeep](https://upkeep.com/pricing/) | Essential USD 24/usuario/mes, Premium USD 55/usuario/mes; el modo offline móvil aparece en Professional, que requiere cotización. | No comparar 15 UF con diez licencias Premium como si incluyeran el mismo offline. Sirve para mostrar cómo el cobro por usuario crece al escalar. |
| [Fiix](https://fiixsoftware.com/cmms/pricing/) | Basic USD 45/usuario/mes; Professional USD 75/usuario/mes e incluye gestión multisede. Diez usuarios Professional serían USD 750/mes a precio de lista. | Referencia internacional de precio por usuario; el alcance funcional es distinto. |
| [DataScope](https://conoce.datascope.io/precios) | Usuarios ilimitados, cobro por acciones y límites publicados de activos por plan; ofrece operación offline. | Competidor de formularios de terreno. No afirmar que GridAssets es el único offline ni que es siempre más barato. |
| [Fracttal](https://www.fracttal.com/es/consultar-precios-fracttal) | EAM/CMMS con modo offline; cotización personalizada, sin tarifa pública comparable. | Competidor funcional importante, incluso en entornos industriales. |
| [headQ](https://headq.cl/software-mantenimiento/) | Precio plano desde CLP 79.000 y hasta CLP 549.000/mes según puntos operativos y usuarios publicados. | Presiona por precio en Chile, pero un “punto operativo” no equivale necesariamente a la jerarquía completa de activos o a una faena. |
| [MacroSens OPS](https://ops.macrosens.com/) | Precio publicado por activo y usuarios ilimitados. | Refuerza el valor de no penalizar un inventario detallado; comprobar el precio vigente antes de usar una cifra puntual. |

**Inferencia comercial:** GridAssets puede justificar 15 UF si el comprador
valora gestionar tres faenas en una sola cuenta, representar equipos y
componentes, ejecutar pautas y mediciones, seguir hallazgos y emitir informes.
No hay evidencia de que el mercado pagará ese monto sin comprobarlo con
cotizaciones y pilotos. No presentar como exclusiva la capacidad offline.

## Economía de la oferta

El [SII publica para el 04-10-2026 una UF de CLP
41.089,96](https://www.sii.cl/valores_y_fechas/uf/uf2026.htm). Son referencias
en pesos de **CLP 410.900**, **CLP 616.349** y **CLP 780.709** al mes por 10,
15 y 19 UF respectivamente, antes de IVA. La [tasa general de IVA es
19%](https://www.sii.cl/destacados/international_transactions/4562-4572-esp-4569.html);
confirmar con contabilidad el tratamiento concreto de la factura. El monto en
CLP cambiará según la UF vigente al facturar.

La propuesta central equivale a **180 UF netas/año** de suscripción y **188 UF
netas el primer año** con implementación de 8 UF. A la UF de referencia:
aproximadamente CLP 7.396.193 y CLP 7.724.912 respectivamente. Una meta de
**70% de margen bruto** exige que infraestructura asignada, almacenamiento,
respaldos, soporte recurrente y operación sumen **como máximo 4,5 UF/mes**
para ese cliente. Es una *meta*, no un costo constatado. Registrar desde el
piloto horas de soporte, ocupación, crecimiento de archivos y costos reales.
Para el plan ampliado de 19 UF, la misma meta deja **5,7 UF/mes** para costos
directos. Evaluar ese presupuesto con el uso combinado de hasta cinco faenas;
sumar sitios no implica que el soporte o el volumen de evidencias sean gratis.

Ejemplo para dimensionar evidencias: **180 trabajos/mes × 4 fotos × 2 MB =
1,44 GB/mes**, alrededor de **17,3 GB en doce meses** sin contar metadatos ni
copias de respaldo. Si las fotos promedian 5 MB, el mismo uso llega a **43,2
GB/año**. Por eso 20 GB de entrada cubren aproximadamente ese escenario de
un año con poco margen; necesita validarse con una muestra real de la empresa.
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

## Evolución del producto y desarrollos a medida

AtomDev desarrolla GridAssets y puede construir reportes, mejoras, módulos e
integraciones solicitados por el cliente. La suscripción paga el acceso y la
operación de las funciones existentes; **no incluye un número ilimitado de
horas de desarrollo**. Corregir defectos respecto del comportamiento acordado
no debe transformarse en una nueva cotización.
Si el pedido se resuelve con la configuración actual de pautas o portada,
tratarlo como parametrización, no como desarrollo de software.

Tarifa sugerida de referencia: **1,5 UF por hora de trabajo + IVA**. A la UF
del 04-10-2026 son cerca de **CLP 61.635 netos por hora**. Un precio de
**1 UF/hora** puede usarse como concesión puntual para una bolsa preaprobada
de al menos 20 horas o un desarrollo reutilizable de interés para AtomDev;
documentar plazo, horas y entregables de esa concesión. No ofrecer **0,5
UF/hora** como tarifa general: equivale a cerca de CLP 20.545 netos y debe
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

## Qué se puede prometer hoy

- Trabajos y respuestas offline **después de preparar la información de la
  faena**, con sincronización al volver la conexión.
- **Fotografías solo con conexión en el flujo actual**; la interfaz desactiva
  la carga en modo local. No ofertar “evidencia fotográfica offline” hasta
  implementarla y probarla.
- Pautas configurables, jerarquía de activos, hallazgos, informes y análisis
  en el alcance actual. Integraciones ERP/SCADA, sensores en tiempo real,
  mantenimiento predictivo y SLA contractual se cotizan solo después de
  evaluación técnica.
- Los tamaños de plan son contractuales/propuestos. El software no restringe
  hoy automáticamente usuarios, faenas, inventario ni GB según precio.

## Forma de vender y validar

1. En la segunda reunión, preguntar por **faenas, usuarios nominativos,
   registros de activos incluidos componentes, trabajos por mes, fotos por
   trabajo, MB promedio y retención exigida**. No pedir solo cantidad de
   activos padre: el almacenamiento lo impulsan más las evidencias.
2. Proponer un **piloto pagado de 60 días** en Multifaena: 15 UF/mes y 8 UF de
   implementación una sola vez. Empezar con una faena y escalar a las otras
   dos durante el piloto. Si continúa, no volver a cobrar implementación.
3. Acordar con el cliente tres resultados medibles: tiempo real de completar
   una pauta y publicar el informe, porcentaje de trabajos con evidencia
   completa y facilidad para recuperar el historial de un activo. Medir una
   línea de base; no prometer horas ahorradas sin ella.
4. Antes de bajar la mensualidad, negociar una concesión **de alcance
   definido**: más acompañamiento temporal o descuento parcial del cargo de
   puesta en marcha a cambio de un compromiso anual. Proteger el precio de
   15 UF como referencia para tres faenas. Cualquier descuento debe dejar
   intacta la capacidad de soporte.
5. Al cierre del piloto, cotejar margen real y uso. Si la empresa necesita
   cuatro o cinco faenas, más de 10 usuarios o 20 GB, evaluar Multifaena
   ampliada. Para más de cinco faenas, varios tenants o una carga inicial y
   soporte que excedan lo incluido, cotizar el alcance adicional o corporativo.

Actualizar la landing al publicar esta oferta: incorporar el plan de 19 UF
con hasta cinco faenas y reservar Corporativo para más de cinco faenas o
varios tenants. La landing actual todavía muestra Corporativo desde cuatro.

Esta oferta es una recomendación de AtomDev. Antes de emitir una cotización
vinculante, confirmar capacidad de infraestructura, condiciones de respaldo,
retención/exportación, responsabilidad del tratamiento de datos, forma de
facturación y política de soporte con el cliente.

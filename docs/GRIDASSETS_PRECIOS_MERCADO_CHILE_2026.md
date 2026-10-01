# GridAssets: precios y mercado chileno

Investigación revisada el 30 de septiembre de 2026. Los precios de terceros son
los publicados por cada proveedor en la fuente enlazada; pueden cambiar y no
equivalen necesariamente a una cotización para minería.

## Qué ofrece el mercado

| Producto                                                       | Enfoque y modalidad publicada                                                                                                                                                                                                                | Precio público observado                                                                                                                |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| [Fracttal One](https://www.fracttal.com/es/gestion-de-activos) | CMMS/EAM con árbol de activos, inspecciones e historial. [Documenta trabajo offline en su app móvil](https://help.fracttal.com/hc/es-es/articles/25290297208461-Modo-Offline-desde-la-aplicaci%C3%B3n-m%C3%B3vil). Tiene presencia en Chile. | [Solicita presupuesto](https://www.fracttal.com/es/consultar-precios-fracttal); no hay una tarifa pública comparable para este alcance. |
| [DataScope](https://datascope.io/es/pricing/)                  | Formularios y operaciones en terreno. Publica captura offline, sincronización y cobro por acción con usuarios ilimitados en planes pagados.                                                                                                  | En su página para Chile: Starter 5 UF/mes + IVA y Professional 8 UF/mes + IVA, con límites de acciones y activos según plan.            |
| [MacroSens OPS](https://ops.macrosens.com/)                    | CMMS industrial chileno con usuarios ilimitados; cobra por activo.                                                                                                                                                                           | Free hasta 10 activos; OPS Pro USD 1,79 por activo/mes.                                                                                 |
| [headQ](https://headq.cl/software-mantenimiento/)              | Mantenimiento y técnicos en terreno para operaciones distribuidas, con activos, checklists y evidencia.                                                                                                                                      | Starter CLP 79.000/mes; Growth CLP 169.000; Pro CLP 249.000; Scale CLP 549.000.                                                         |
| [BaseLogic EAM](https://baselogic.cl/productos/eam)            | Oferta chilena dirigida a minería y contratistas: activos, órdenes, mantenimiento e inventario.                                                                                                                                              | Cotización; no publica tarifa.                                                                                                          |
| [UpKeep](https://upkeep.com/pricing/)                          | CMMS internacional por usuario, con activos e inspecciones. El modo offline móvil figura en Professional.                                                                                                                                    | Essential USD 24/usuario/mes, Premium USD 55/usuario/mes; Professional y Enterprise, cotización.                                        |

No es correcto presentar GridAssets como la única opción que funciona sin
conexión. Fracttal, DataScope y UpKeep publican esa capacidad. El espacio para
diferenciarse es la combinación concreta de jerarquía de activos de faena,
pautas por tipo de trabajo, conceptos de componentes descendientes, hallazgos,
mediciones, informes y ejecución offline. Esta es una hipótesis comercial sobre
el encaje de esas funciones, no una afirmación de exclusividad.

## Recomendación de cobro

Cobrar una suscripción base por alcance de faenas. No cobrar por cada activo o
componente: la estructura puede tener muchos niveles y ese cobro desincentivaría
registrarla completa. Tampoco conviene cobrar por cada respuesta o fotografía:
el cliente debería registrar toda la evidencia necesaria. Los usuarios, el
volumen de datos y el soporte se dimensionan en la propuesta comercial.

| Plan propuesto           | Precio de lanzamiento orientativo | Alcance base                                                                                                                                                                  |
| ------------------------ | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Una faena                | Desde 10 UF/mes + IVA             | 1 faena, todas las funciones actuales (incluido offline, informes y analítica) y puesta en marcha autogestionada.                                                             |
| Multifaena · recomendado | Desde 15 UF/mes + IVA             | Hasta 3 faenas, las mismas funciones, configuración guiada de la primera pauta, 2 sesiones remotas de arranque de 60 minutos y revisión mensual de indicadores de 30 minutos. |
| Corporativo              | Cotización                        | Más de 3 faenas o despliegue y soporte de mayor alcance.                                                                                                                      |

El [SII informa que la UF del 30 de septiembre de 2026 vale
$41.057,20](https://www.sii.cl/valores_y_fechas/uf/uf2026.htm). Con ese valor,
10 UF equivalen aproximadamente a **$410.572** y 15 UF a **$615.858**,
ambos antes de IVA. La equivalencia en pesos cambia con la UF; el contrato en
UF no garantiza un monto fijo en CLP cada mes.

La diferencia entre planes es de **5 UF mensuales** (unos $205.286 con la UF
citada). Se justifica por dos faenas adicionales y acompañamiento acotado:
configuración de una pauta, dos sesiones iniciales y una revisión mensual de
30 minutos. Estas prestaciones requieren capacidad humana de AtomDev; registrar
su duración y alcance en la cotización. No afirmar que el plan básico carece de
informes o analítica: hoy el producto no aplica restricciones por plan.

Estos precios son una **recomendación comercial de AtomDev**, inferida de los
modelos públicos anteriores y del valor específico de GridAssets. No son una
medición de disposición a pagar. El sitio los muestra como valores **desde** y
lleva a una cotización, porque hoy no hay compra automática ni límites de plan
implementados en el producto. No presentar el plan como un SLA, integración ERP,
mantenimiento predictivo o automatización que todavía no ofrece la plataforma.

Cotizar la carga o migración inicial, la configuración fuera de la pauta guiada
y la capacitación adicional por separado cuando sean necesarias. Especificar
por escrito usuarios, almacenamiento de fotos, soporte, plazo y costo de
puesta en marcha antes de cerrar cada venta.
Mantener la descarga previa de la faena como condición explícita del uso offline.

## Cómo validar el precio

1. Cotizar el mismo caso real (una faena, número de usuarios y volumen de
   evidencia) con al menos dos competidores para comparar costo total, no solo
   tarifa mensual.
2. Ofrecer pilotos pagados a tres clientes de perfiles distintos: contratista,
   operación de una faena y empresa multifaena. Registrar objeciones de precio,
   horas de configuración y soporte utilizado.
3. Revisar margen por cliente: mensualidad menos infraestructura, respaldo,
   almacenamiento, soporte y costo comercial amortizado. Ajustar el precio base
   o los servicios de puesta en marcha con datos de los pilotos.
4. Publicar condiciones definitivas de cada plan solo cuando los límites y la
   capacidad de soporte estén validados. Mientras tanto, conservar el llamado
   a solicitar cotización que aparece en la landing.

## Fuentes primarias

- [Fracttal: gestión de activos](https://www.fracttal.com/es/gestion-de-activos), [modo offline](https://help.fracttal.com/hc/es-es/articles/25290297208461-Modo-Offline-desde-la-aplicaci%C3%B3n-m%C3%B3vil), [consulta de precios](https://www.fracttal.com/es/consultar-precios-fracttal).
- [DataScope: precios para Chile](https://datascope.io/es/pricing/) y [planes y modo offline](https://conoce.datascope.io/precios).
- [MacroSens OPS: precio por activo](https://ops.macrosens.com/).
- [headQ: planes en CLP](https://headq.cl/software-mantenimiento/).
- [BaseLogic EAM: oferta para minería](https://baselogic.cl/productos/eam).
- [UpKeep: planes y disponibilidad offline](https://upkeep.com/pricing/).
- [SII: valor diario de la UF en 2026](https://www.sii.cl/valores_y_fechas/uf/uf2026.htm).

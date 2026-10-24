# Pautas de porciones en MacroFit

Los macronutrientes (gramos de proteína, carbohidratos y grasas) y las porciones
de una pauta son indicadores independientes. No se convierte el total de proteína
en porciones dividiéndolo por una constante.

## Configuración y cálculo

En **Mi pauta** se configuran metas por grupo, agua y equivalencias por alimento.
Una meta `null` significa libre/sin meta; `0` significa que no hay porciones
previstas. Cada equivalencia declara cantidad y unidad de referencia, preparación,
nombres alternativos exactos y aportes a uno o varios grupos. Los alimentos libres
no necesitan aportes numéricos.

La referencia precargable es editable y requiere guardar para activarse. Se basa
en las tablas revisadas del documento aportado; no asigna automáticamente metas
calóricas ni convierte el menú de ejemplo en una distribución obligatoria.
Se muestra la discrepancia de 50/100 g de pollo del documento al cargarla.
Se omiten equivalencias del catálogo que no se pudieron confirmar en esas tablas.

`libs/macrofit-contracts/src/pauta.ts` implementa el cálculo compartido:

```text
aporte = cantidad consumida / cantidad de referencia × aporte de la regla
```

El backend vuelve a calcular todos los aportes; ignora snapshots enviados por el
cliente. La selección explícita tiene prioridad sobre una coincidencia exacta de
ID o nombre. Los casos ambiguos, sin equivalencia o con unidades incompatibles
quedan pendientes. El cálculo automático no usa coincidencias difusas ni conversiones inferidas por IA.
Las sugerencias por nombres relacionados requieren una selección y confirmación explícitas.
La precisión se mantiene al sumar; solo se redondea al mostrar.

Se admiten `g`, `ml`, `unit` y `scoop`. Una conversión de gramos a otra unidad
solo se permite cuando se configura `gramsPerUnit`. Una cantidad adicional de
pauta permite registrar, por ejemplo, una barra por unidad mientras los
nutrientes del análisis siguen calculados sobre su peso real.

## Persistencia e historial

La migración `AddNutritionPlans1792742400000` agrega `nutrition_plans` y la
referencia `plan_version` al diario. No modifica ni calcula de nuevo las comidas
anteriores. Conserva el patrón NestJS/TypeORM existente: migraciones registradas
en `database.config.ts`, `MACROFIT_MIGRATIONS_RUN=true` y `synchronize=false`.
No requiere otra base, puertos, variables ni cambios de Docker/Compose.

Cada guardado crea una versión inmutable por usuario con fecha de inicio. La
validación del inicio usa la fecha de Chile (`America/Santiago`) y rechaza fechas
pasadas. El primer registro o clasificación de alimentos de un día con pauta
fija esa versión para el diario. Cambios posteriores, incluso recalcular metas
de macronutrientes, conservan dicha referencia y los aportes guardados.
Guardar solo agua no fija una versión.

El guardado admite `applyToToday: true` como opción explícita: vincula el diario
de hoy con la versión nueva y recalcula únicamente sus aportes de pauta en la
misma transacción. No cambia nutrientes, alimentos, cantidades, agua ni días
anteriores. Si se eliminó una equivalencia elegida manualmente, el alimento queda
pendiente. La opción se ofrece marcada al completar una pauta inicial o vacía.
No se permite activar una pauta sin metas y equivalencias; las versiones vacías
anteriores siguen siendo legibles para poder completarlas desde la interfaz.

Los registros sin snapshot quedan pendientes cuando el día tiene una pauta
activa y pueden revisarse desde el diario sin cambiar sus nutrientes.
Los días anteriores al inicio de la pauta no reciben una pauta retroactivamente.

`quantity` contiene cantidad/unidad explícitas de las comidas nuevas. Los campos
numéricos históricos `amountGrams` y `servingSizeGrams` se conservan por
compatibilidad: cuando hay una unidad explícita, expresan esa cantidad numérica
y no implican un peso. En registros antiguos sin unidad se interpretan como
gramos. Los combos conservan unidad y snapshot; si un combo antiguo sin snapshot
ya no coincide con las unidades del catálogo, debe revisarse antes de aplicarlo.

## Endpoints y autenticación

El navegador usa el BFF con JWT; el BFF reemplaza `x-user-id` por la identidad
verificada. La API interna conserva su guard y red privados.

- `GET /api/macrofit/me`: incluye la última versión configurada, incluso futura.
- `PUT /api/macrofit/me/plan`: guarda una nueva versión de la pauta.
- `GET /api/macrofit/me/days/:date`: incluye la pauta efectiva/fijada del diario.
- `POST /api/macrofit/me/days/:date/meals`: calcula los aportes en el servidor.
- `PUT /api/macrofit/me/days/:date/meals/:id/pauta`: revisa la equivalencia de un
  registro usando exclusivamente las reglas de la pauta de ese día.

Los writes usan los bloqueos transaccionales por usuario que ya emplean los
registros personales. Se preservan la atomicidad de lotes y los reintentos
idempotentes. Los errores reales de almacenamiento y análisis siguen llegando
al cliente; no se generan alimentos ni consumos ficticios.

## Sugerencias revisables al clasificar

En el clasificador del diario, **Sugerir equivalencia** consulta las reglas reales
que ya están guardadas: las de la pauta fijada de ese día (incluidas sus reglas
locales de productos) y, al seleccionar un producto propio, las de la última
versión de la cuenta. No modifica datos. La respuesta distingue el origen,
la coincidencia de nombre y lo que falta verificar. Cada tarjeta muestra la
cantidad/unidad de referencia y el aporte proporcional del consumo actual.

Se priorizan identificadores y nombres/alias exactos. Los nombres relacionados
son candidatos para revisar, nunca selecciones automáticas; se excluyen
preparaciones explícitamente contradictorias y referencias libres que no
identifiquen exactamente el alimento. Si hay varias opciones, el usuario elige.
Una marca o una palabra genérica de preparación no basta para relacionar comidas.
La búsqueda conservadora puede dejar sin sugerencia un sinónimo no configurado.

**Comparar con IA** es opcional y requiere pulsar su botón. Gemini solo puede
seleccionar identificadores de un conjunto acotado de referencias relacionadas:
no devuelve cantidades, grupos o porciones nuevos. El servidor recupera esos
valores de la regla guardada y rechaza claves desconocidas o salidas inválidas.
Solo se envían nombres/marca del alimento y nombres, alias (hasta ocho), unidad
y estado libre de hasta veinte referencias; no se envían perfil, metas, diario,
credenciales, nutrientes ni notas personales. Usa el modelo, los límites,
concurrencia, plazo y manejo de errores compartidos de los otros análisis.
No requiere variables ni dependencias nuevas.

Sin una referencia adecuada (por ejemplo, mostaza ausente de la pauta), se indica
qué falta y se ofrece continuar pendiente. No se consulta al proveedor cuando
no hay candidatos elegibles. Pocas calorías no implican que sea libre; los macros
no se convierten a grupos de intercambio. Una respuesta de IA vacía o un error
se muestran como tales, sin reemplazarlos por recomendaciones ficticias.

**Aplicar al formulario** rellena una propuesta; no guarda nada. El usuario revisa
la referencia, las unidades y el aporte, y confirma con el guardado existente.
Si las unidades no son compatibles, debe declarar el consumo en la unidad de
la referencia. Solo se usa una conversión `gramsPerUnit` ya configurada.
Las respuestas no sobrescriben ediciones manuales al llegar. Cambiar de producto,
catálogo, versión, consumo o cerrar el modal descarta la solicitud anterior.

`POST /api/macrofit/me/days/:date/meals/:id/equivalence-suggestions` pasa por el
BFF con JWT y valida cuerpo estricto (`productId?`, `dayPlanVersion`,
`catalogPlanVersion`, `useAi`). Comprueba propietario del registro/producto y
versiones (409 si cambiaron), responde con `Cache-Control: no-store` y conserva
la versión histórica del diario. No crea registros ni fija pautas al consultar.
La API interna usa el mismo guard de identidad del módulo personal.
No agrega migraciones, tablas, servicios Docker ni cambios de infraestructura.

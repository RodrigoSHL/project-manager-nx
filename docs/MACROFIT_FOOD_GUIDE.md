# Qué puedo comer

El módulo se abre desde **Diario → Ver opciones** o desde **Qué puedo comer** en el sidebar. Usa la fecha elegida en el diario y ofrece dos análisis:

- **Según mis macros:** compara energía, proteínas, carbohidratos y grasas registrados con las metas guardadas actuales. Muestra lo que falta o excede cada meta, señala el mayor margen proporcional y propone hasta tres opciones que caben individualmente en los cuatro márgenes.
- **Según mi pauta:** usa la versión efectiva de la pauta de ese diario y sus porciones ya clasificadas. Ofrece ejemplos para los grupos pendientes, con filtros por grupo. **Ver avance de todos los grupos** despliega consumido, objetivo y pendiente; las opciones se muestran antes para reducir desplazamiento, especialmente en móvil.

## Ejemplo de uso

1. Registrar las comidas del día y revisar su clasificación en la pauta.
2. Abrir **Ver opciones** en el inicio. Consultar cuánto queda de cada macro.
3. Cambiar a **Según mi pauta**. Si proteínas y carbohidratos están cubiertos pero faltan frutas o lácteos, esos grupos siguen mostrando ejemplos. Las verduras libres se identifican aparte, sin inventar una meta numérica.
4. Filtrar, por ejemplo, **Lácteos** para comparar alternativas. Las opciones son independientes: no forman un menú que se deba registrar completo.
5. Pulsar **+**, ajustar cantidad y elegir tiempo de comida. El modal muestra el aporte de esa cantidad, cómo quedaría el total del día y el impacto en porciones.
6. **Confirmar y registrar** guarda mediante el flujo existente del diario. Consultar o seleccionar una idea no guarda nada. Cancelar no escribe; un fallo de guardado conserva la revisión con su mensaje.

## Datos y cálculo

El cálculo es local sobre los datos cargados desde el backend existente: comidas de la fecha seleccionada, metas de la cuenta, pauta efectiva, productos personales y catálogo base. No se agregan endpoints, tablas, migraciones, localStorage ni llamadas a Gemini o buscadores. Los registros confirmados se guardan en PostgreSQL por el mismo flujo autenticado del diario.

Los productos se distinguen como **Mi producto**, **Catálogo base · valores de referencia** o **Referencia de mi pauta**. Las equivalencias por sí solas no contienen calorías ni macros. Si falta una ficha compatible con las unidades de la regla, se muestran las porciones conocidas y se ofrece completar la ficha en **Mis productos**; los nutrientes quedan desconocidos, sin ceros ficticios ni registro automático de un alimento incompleto.

Para macros se considera una cantidad base del catálogo o media cantidad medible cuando la base completa no cabe. No se generan cantidades diminutas para aparentar que una opción encaja; unidades y scoops se proponen enteros. Se comparan los cuatro indicadores y se favorece diversidad de categorías entre las opciones seleccionadas. La energía declarada se conserva. `scaleFoodNutrients` comparte el redondeo del diario (kcal enteras, macros a un decimal), para que la proyección coincida con el registro.

Para pauta se propone hasta una porción pendiente del grupo por alternativa, escalada desde la referencia explícita. Una regla puede aportar varios grupos: si completar proteínas mediante legumbres agrega porciones a carbohidratos ya cubiertos, se muestra ese aporte adicional. Las porciones nunca se deducen a partir de gramos de proteína, carbohidratos o grasas.

No se convierten g/ml/unidades por suposición. Solo se usa `gramsPerUnit` cuando está declarado en la regla efectiva. Una opción elegida desde pauta conserva su `ruleId` al registrar. Las ideas con ficha nutricional permiten ajustar su cantidad en la unidad nativa y recalculan la vista previa antes de confirmar.

## Coincidencias, libres y datos parciales

Se reutiliza `findPautaRule`: identificador de producto o coincidencia exacta normalizada de nombre/alias; una coincidencia ambigua queda sin vincular. No se aplican reglas de una pauta más reciente al consultar un diario que conserva otra versión.

Los alimentos pendientes de clasificar o con una versión de pauta distinta cuentan en nutrientes, pero no se completan sus porciones al leer. El módulo indica que el análisis es parcial; ausencia de porciones clasificadas no demuestra ausencia de consumo.

Las reglas libres actuales no guardan un grupo alimentario. Para las verduras libres se usa la metadata explícita de las referencias reconocidas de la plantilla, comprobando identificador y nombre. Se cuentan **registros identificados**, no porciones inventadas; un condimento libre no se interpreta como verdura. Las reglas libres personalizadas sin ese respaldo no permiten inferir ese grupo. La medida casera de la plantilla se muestra solo si sus notas se conservan; no se inventa un peso a partir del marcador de cantidad de una regla libre.

«Libre» se refiere al conteo de porciones de esa pauta, no a calorías o macros nulos. Las ideas de pauta permanecen disponibles aunque excedan un margen de macros; el aporte adicional queda visible, sin cambiar automáticamente objetivos ni cantidades registradas. Las metas de macros corresponden a la configuración actual de la cuenta: aún no existe un historial fechado de esas metas.

## Verificación

Las pruebas cubren macros completos con grupos pendientes, clasificación parcial, reglas mixtas, unidades incompatibles y conversión explícita, alimentos libres, cantidades fraccionarias y redondeo del diario. Los flujos de interfaz verifican acceso desde inicio/sidebar, cambio de fecha con snapshot anterior, revisión en ml, confirmación, actualización del avance, cancelación y fallo de guardado, además de navegación por teclado entre las dos pestañas.

# Catálogo personal de productos

La sección **Mis productos** permite crear productos manualmente, buscar por nombre o código de barras en Open Food Facts y transcribir una tabla nutricional fotografiada con Gemini. Cada resultado es un borrador editable: nunca se guarda ni se agrega al diario automáticamente.

El formulario requiere nombre, cantidad y unidad base, kcal, proteínas, carbohidratos y grasas. Marca, código de barras, fibra y notas son opcionales. Los campos faltantes permanecen vacíos; cero significa un cero declarado. Las kcal se conservan sin reemplazarlas por una fórmula basada en macros. Los nutrientes siempre corresponden a una misma cantidad base; la cantidad consumida se elige después en el diario. No se convierte ml a g sin una equivalencia explícita.

## Persistencia y reutilización

Se reutiliza `nutrition_foods` (JSONB), las transacciones y el bloqueo por usuario de NutritionService. No requiere otra tabla, migración, variable de entorno, Dockerfile ni ruta de Caddy. `FoodItem` incorpora opcionalmente `barcode` y `productSource`; los registros anteriores siguen siendo válidos.

Las operaciones existentes `PUT /api/macrofit/me/foods` y `DELETE /api/macrofit/me/foods/:id` permiten crear, editar y eliminar. Editar conserva el identificador. Un mismo código no puede duplicarse dentro de una cuenta al guardar, incluso ante escrituras simultáneas; otra cuenta puede tener su propia ficha. Los diarios y combos conservan sus snapshots al editar o eliminar un producto.

Los productos personales aparecen en el selector de alimentos del diario. Se puede buscar por nombre, marca o código. Agregar un producto no crea una equivalencia clínica: los aportes por porciones se configuran en **Mi pauta**.

## Consulta externa

`GET /api/macrofit/products/search?q=...` requiere JWT en el BFF y consulta la API interna `GET /api/products/search`. La consulta se dispara al enviar el formulario. El servidor usa los dos dominios fijos oficiales, User-Agent de MacroFit, una selección acotada de campos, máximo 12 resultados y un plazo de 12 segundos. No envía registros personales ni fotos a Open Food Facts.

Se usa la lectura v2 para códigos y la búsqueda de texto de Search-a-licious (`https://search.openfoodfacts.org/search`). La búsqueda identifica candidatos por nombre/código; antes de revisar una importación se solicita su ficha vigente por código para no usar nutrientes de un índice desactualizado. La consulta se limita a letras, números y espacios, priorizando coincidencias de frase para evitar interpretar sintaxis avanzada. El proceso permite 8 búsquedas por nombre y 12 por código por minuto, máximo dos consultas simultáneas; combina consultas idénticas en curso y conserva hasta 100 resultados durante cinco minutos. Estos límites se comparten entre cuentas por instancia; si se escala a varias instancias con la misma IP de salida, se necesita un límite compartido.

Los campos normalizados `_100g` pueden representar 100 g o 100 ml. Se consultan unidades explícitas del producto/porción; si faltan o se contradicen, la unidad queda pendiente de revisión. Se ignoran valores por porción, preparados, estimados, unidades kJ y valores con desigualdades. No se mezclan columnas ni se rellenan datos ausentes. Un resultado vacío significa no encontrado; errores, cuota y timeout tienen mensajes distintos y dejan disponible el ingreso manual.

Cada importación conserva el enlace a la ficha y muestra atribución a Open Food Facts (base ODbL, contenidos DBCL). No se importan imágenes ni se publican productos de la cuenta en ese servicio. Referencias: [buscador](https://openfoodfacts.github.io/search-a-licious/users/ref-openapi/), [API](https://openfoodfacts.github.io/openfoodfacts-server/api/), [esquema nutricional](https://openfoodfacts.github.io/documentation/docs/Product-Opener/schemas/schemas/product_nutrition/).

## Lectura de etiqueta

`POST /api/macrofit/analyze-product-label` requiere JWT y multipart con `image`. El BFF aplica límites de carga y la API interna verifica el contenido con Sharp: JPEG/PNG/WebP de hasta 5 MiB y 16 millones de píxeles, una sola imagen. Normaliza orientación, elimina metadatos y genera JPEG de hasta 1800 × 1800. La foto se envía a Gemini solo al elegirla para lectura y no se almacena en la base.

Se reutiliza `GEMINI_MODEL` y la misma instancia del servicio de análisis, con su cuota, concurrencia, timeout y reintento. El prompt pide transcribir información visible, elegir una sola columna y devolver `null` ante datos ausentes/ilegibles/ambiguos. El servidor valida la estructura; una etiqueta sin nutrientes legibles produce 400. Una respuesta válida todavía puede contener errores de lectura: el usuario revisa y confirma antes de guardar.

## Cámara y galería en móviles

Las opciones de tomar foto y elegir una imagen existente usan controles distintos. Solo el control de cámara incluye `capture="environment"`; el de galería omite `capture`. Ambos permanecen disponibles en las etiquetas; en el análisis de platos la galería funciona aunque no se conceda acceso a la cámara directa. La cámara se detiene al cerrar el modal o seleccionar una imagen, incluso si el permiso termina de resolverse después del cierre.

La compatibilidad del selector nativo debe comprobarse en el dispositivo. Referencia: [HTML capture](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/capture).

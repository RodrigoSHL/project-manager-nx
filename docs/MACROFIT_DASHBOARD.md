# Dashboard de seguimiento de MacroFit

Se accede desde **Mi seguimiento** en el menú o **Ver mi seguimiento** en el diario. El diario continúa siendo la pantalla inicial para registrar alimentos rápidamente.

## Funcionamiento

- Períodos de 7, 30 y 90 días, con fecha final seleccionable. Incluyen ambos extremos.
- Resumen de días con comidas, promedio de energía de esos días, días sobre la meta actual de energía y alimentos pendientes de clasificar.
- Gráfico de energía, proteínas, carbohidratos o grasas con la meta actual como referencia.
- Gráfico de porciones por grupo con la meta de la versión histórica de pauta de cada día.
- Gráfico de agua con el objetivo de la pauta del día o de la configuración actual si no hay pauta.
- Detalle por día: consumo, objetivo, faltante o exceso, pauta y advertencia de clasificación parcial. Acceso al diario para corregir o completar ese día.
- Tabla desplegable con los valores de los gráficos y acceso a cada fecha.

**Interpretación:** un día sin alimentos no es un día de consumo cero. No se incluye en el promedio de energía y aparece como una interrupción en el gráfico de consumo. El agua sin registro también se muestra como ausencia de datos. Los registros pueden estar incompletos; no se supone que un día esté cerrado.

Los macros usan las metas **actuales** porque el modelo existente no almacena sus versiones históricas. La interfaz lo indica expresamente. Las pautas sí conservan su versión por día. Se suman exclusivamente las porciones de los snapshots guardados compatibles con esa versión; no se convierten gramos de nutrientes a intercambios ni se reclasifican alimentos al leer. Las metas libres (`null`) y las metas cero se distinguen.

## API y datos

`GET /api/macrofit/me/dashboard?from=YYYY-MM-DD&to=YYYY-MM-DD`

El BFF autentica con JWT, valida un intervalo de hasta 90 días y reemplaza cualquier cabecera de identidad externa. La API interna vuelve a validar el intervalo y requiere identidad interna. Todas las consultas filtran por el propietario autenticado. La respuesta usa `Cache-Control: no-store` y contiene solo agregados diarios, metas actuales y objetivos históricos; no incluye nombres de alimentos ni catálogos de equivalencias.

La lectura utiliza las tablas existentes: perfil, diarios, comidas y versiones de pauta. No crea diarios ni modifica registros. No requiere migraciones, variables nuevas, cambios de Docker o llamadas a IA. El frontend valida la respuesta con el contrato compartido, cancela las peticiones obsoletas y ofrece reintentar si falla la carga. Los gráficos se cargan en un chunk separado al abrir el módulo y usan Recharts, ya instalado en el monorepo.

Para publicar la funcionalidad se deben desplegar **macro-fit-api**, **bff-api** y **macro-fit-web**.

## Validación

- Pruebas de agregación: versión de pauta fijada, porciones pendientes, días sin registros, separación por propietario e intervalos inválidos.
- Prueba HTTP del BFF: JWT obligatorio, rangos limitados, rechazo de un propietario enviado por el cliente y cabecera `no-store`.
- Pruebas frontend: promedios, excesos, porciones parciales, filtros, recuperación de errores, navegación y estados vacíos.
- Revisión visual local con datos sintéticos en escritorio y móvil; los datos de prueba no se guardan en una cuenta ni forman parte del producto.

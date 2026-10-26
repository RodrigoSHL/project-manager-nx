# Mis combos

El módulo está en **Sidebar → Mis combos** y en **Diario → botón de combos de una comida → Administrar mis combos**.

## Uso

1. **Crear combo**: indicar nombre y comida habitual, buscar alimentos del catálogo base o de Mis productos, agregar y ajustar cantidades en su unidad nativa. Los totales se actualizan al editar. **Guardar combo** guarda en la cuenta sin agregar comidas al diario.
2. **Editar**: cambiar nombre, descripción, comida, alimentos o cantidades. Se actualiza el mismo identificador.
3. **Duplicar**: abre un borrador independiente con un identificador nuevo. Nada se guarda hasta confirmar; cancelar conserva el original.
4. **Registrar**: revisar fecha y tiempo de comida, elegir mitad/completo/doble u otro factor y ajustar cantidades individuales. Cambiar el factor reinicia los ajustes individuales. La vista previa muestra macros y porciones de la pauta de ese día. Solo **Confirmar y registrar** agrega el lote al diario.
5. **Eliminar**: requiere confirmación en la interfaz. Se quita el combo, conservando comidas y productos.

El buscador encuentra nombres de combos, descripciones y sus ingredientes, sin distinguir tildes. El filtro por comida permite reducir la lista. Los ejemplos base están en una pestaña separada y solo se incorporan al catálogo personal al crear y guardar una copia. Los iconos son Lucide, sin emojis.

Se conserva **Guardar actual como combo** en el diario, incluidos los alimentos ingresados mediante foto o texto que no pertenecen al catálogo. Esos combos también aparecen en el módulo.

## Persistencia y cálculo

Se reutilizan `PUT /api/macrofit/me/templates` y `DELETE /api/macrofit/me/templates/:id`, ya protegidos por JWT en el BFF y acotados al propietario en MacroFit API. Editar usa el mismo ID; crear o duplicar genera uno nuevo. Los datos viven en `nutrition_templates` mediante el backend existente. No se agregan endpoints, tablas, migraciones, dependencias ni localStorage.

Cada ingrediente guarda cantidad, unidad y ficha nutricional. Editar o eliminar un producto no cambia los valores de un combo ya guardado; se puede reemplazar su ingrediente para usar otra ficha. Cambiar un combo tampoco reescribe comidas registradas.

`previewMealTemplate` se comparte entre editor, módulo, selector del diario y aplicación del combo. Usa el mismo redondeo por alimento que el diario (kcal enteras, macros a un decimal) y conserva la energía declarada. No convierte entre gramos, mililitros, unidades, scoops o tazas. El nombre histórico `amountGrams` también representa cantidades nativas, acompañado de `quantityUnit`.

Una referencia explícita de pauta guardada en un snapshot se escala respecto de su base nutricional. Si 150 g representaban una taza declarada, 300 g representan dos; no se infiere la conversión. Si la regla ya no pertenece a la pauta del día, queda pendiente de clasificar y el registro de nutrientes puede continuar, sin enviar un ID ajeno ni elegir otra referencia automáticamente. Se conservan el snapshot y las metas de ese diario.

Si falta un alimento o cambió una unidad en un combo antiguo sin snapshot, no se muestran totales parciales como completos ni se permite registrarlo incompleto. **Editar → Reemplazar alimento** permite repararlo. Las cantidades válidas van de 0,001 a 20000 por ingrediente; el contrato admite de 1 a 100 alimentos. La aplicación del lote es atómica por el endpoint existente de comidas.

La funcionalidad no usa IA ni consume cuota de Gemini. Las pruebas cubren CRUD, duplicados independientes, recarga, cancelación/fallo de guardado, reparación de referencias antiguas, registro por fecha/comida, unidades nativas, ajustes individuales, redondeo y escalado de conversiones explícitas de pauta.

# jira-web · Design TODO & Guidelines

## Dialogs

### Tamaños estándar

El componente base `DialogContent` en `components/ui/dialog.tsx` **no** impone un `max-w` propio — cada dialog elige su tamaño con el prefijo `sm:`:

| Talla | Clase            | Uso típico                          |
|-------|------------------|-------------------------------------|
| S     | `sm:max-w-sm`    | Confirmaciones, alertas simples     |
| M     | `sm:max-w-md`    | Formularios cortos (sprint, fechas) |
| L     | `sm:max-w-2xl`   | Formularios completos (ticket)      |
| XL    | `sm:max-w-4xl`   | Vistas de detalle, tablas           |

```tsx
// Ejemplo — dialog tamaño L
<DialogContent className="sm:max-w-2xl">
```

> **Por qué `sm:`** — sin el prefijo responsive el navegador aplica el ancho máximo en móvil también y puede quedar cortado. Con `sm:` se activa solo a partir de 640 px.

---

### Dialogs actuales

| Componente                    | Tamaño | Notas                            |
|-------------------------------|--------|----------------------------------|
| `create-sprint-dialog.tsx`    | M      | `sm:max-w-md`                    |
| `edit-sprint-dialog.tsx`      | M      | `sm:max-w-md`                    |
| `create-ticket-dialog.tsx`    | L      | `sm:max-w-2xl`                   |

---

## TODO — Diseño

- [ ] Dialogs de confirmación para acciones destructivas (eliminar sprint, etc.)
- [ ] Talla XL para futuro dialog de detalle de ticket editable
- [ ] Skeleton loaders en lista de proyectos y sprint view
- [ ] Animación de entrada en tarjetas de sprint inactivos
- [ ] Feedback visual (toast) al crear / editar / eliminar ticket y sprint
- [ ] Empty state ilustrado en Backlog cuando no hay tickets
- [ ] Modo compacto del sidebar en tablet (hover expand)
- [ ] Dark/light color tokens documentados para colores de proyecto

# Swipe — Comparador de configuraciones con barra divisora

Documenta la herramienta de comparación tipo *swipe* (una sola vista de mapa con dos configuraciones de capas independientes lado a lado, separadas por una barra divisora vertical arrastrable).

Desde v1.12 reemplaza al antiguo modo `compare-split` (lado a lado por fechas), que se elimina por completo.

## Modelo

Estado en `MapsProvider`:

```
compareMode = {
    active: boolean,
    activeSlot: 'A' | 'B',
    paneA: { activeLayerIds, hiddenLayerIds, layerOpacities, filters, label },
    paneB: { activeLayerIds, hiddenLayerIds, layerOpacities, filters, label },
    swipePosition: number,         // 0.05 .. 0.95
}
```

Cada pane es un **snapshot completo** de capas, opacidades, visibilidad y filtros. El estado global de capas espeja al `activeSlot`: toda mutación que el usuario hace desde el sider, panel de capas o filtros se aplica al slot activo, y al cambiar de slot se hace swap entre el global y el pane congelado.

### Compartido entre A y B

- `view` (centro, zoom, rotación) — sincronizado con `useViewSync`
- `baseMapId`
- `selectedLayerForSymbology`
- Filtros espaciales (municipio, etc., cuando lleguen)

### Renderizado

`SwipeView` monta dos `MapView` con `paneIndex={0|1}` y snapshot por prop. Cada `MapView` re-renderiza solo cuando su pane cambia. El lado derecho se recorta con `clipPath: inset(0 0 0 ${pos}%)`. La barra es un drag handle CSS — no dispara peticiones WMS.

### Entrada y salida

- **Entrada**: botón "Barra divisora" en `ToolsMenu`. Al activar: `paneA = snapshot(estado actual)`, `paneB = copia(paneA)`, `activeSlot = 'B'`, `swipePosition = 0.5`.
- **Salida**: botón "Salir" conserva el slot activo sin preguntar. Junto al botón hay un link "descartar A" / "descartar B" para conservar el otro.
- **Vaciar slot B**: botón explícito en el header del sider para dejar B en estado limpio (sin capas).

### Estilo visual

Todos los controles del swipe (selector A/B, leyenda chip, salir, descartar, vaciar) usan la paleta de la barra de mediciones (`MeasurementTools/ToolSelector.jsx`):

- Base inactivo: `bg-[#EAEFFA] text-[#703089] hover:border-[#5C2472]`, `rounded-full`, `size-12.5`
- Activo / seleccionado: `bg-[#703089] text-white`
- Destructivo (descartar, vaciar): `text-[#FF577D] hover:border-[#FF577D] active:bg-[#FF577D] active:text-white`
- Tooltip con delay 300–400 ms
- Color asociado al slot: A = azul, B = naranja (`#FF8300`, mismo del handle del swipe)

## Persistencia

### Share

Envelope `kind: 'swipe'`:

```json
{
    "version": 1,
    "kind": "swipe",
    "payload": {
        "shared": { "view", "basemap", "selected" },
        "paneA": { "label", "layers": [...], "opacities", "hidden", "filters" },
        "paneB": { "label", "layers": [...], "opacities", "hidden", "filters" },
        "position": 0.5
    }
}
```

`useShareSerializer` y `useShareDeserializer` aceptan únicamente `kind: 'single' | 'swipe'`. **No hay fallback** para envelopes legacy `kind: 'compare'` ni para el formato anterior de `kind: 'swipe'` (la herramienta no se había liberado, no existen enlaces vivos).

### URL viva

Refleja **solo el slot activo** + flag `?compare=swipe`. El estado completo (ambos snapshots) vive en `sessionStorage` y en el share generado. Si se entra con `?compare=swipe` sin sessionStorage, cae a modo single.

`sessionStorage` ya no debe contener IDs de capas crudos; siempre se serializa por slug (consistente con shares).

### Dirtiness

`useShareDirtiness` compara el envelope cargado contra **ambos** snapshots cuando el envelope es `kind: 'swipe'`. Si solo compara contra el slot activo, da falsos positivos/negativos.

## Herramientas que NO funcionan en swipe (V1)

| Herramienta | Estado en swipe | Razón |
|---|---|---|
| Mediciones | bloqueada | Pendiente — ver V2 abajo |
| ZenMode | bloqueada | Pendiente — ver V2 abajo |
| InfoBox / clicks | bloqueada | Pendiente — ver V2 abajo |
| Loop temporal | se cancela al entrar | Pendiente — ver V2 abajo |
| `CompareDateModal` | eliminado | Atajo "comparar dos fechas" se elimina por consistencia. Toda configuración se hace desde el sider con el toggle de slot |

## Herramientas que SÍ funcionan en swipe (V1)

- **Compartir**: genera envelope `kind: 'swipe'` con ambos snapshots
- **Descarga del mapa (PNG/PDF)**: captura el composite (los dos lados con la barra incluida — lo que ve el usuario)
- **Leyenda**: una sola, con chip arriba "Mostrando leyenda de A | cambiar a B" usando estilos de mediciones
- **Filtros sobre capas del slot activo**: cualquier filtro CQL que ya existía sigue funcionando, solo aplica al slot activo

---

# Pendientes — V2

Funcionalidad fuera del alcance de la primera entrega del swipe. Se documenta aquí para no perder contexto.

## V2.1 — Loop temporal en swipe

Hoy `useDateLoop` se cancela al entrar al swipe. Opciones cuando se retome:

1. **Loop por slot activo**: el loop muta solo el slot seleccionado. Simple.
2. **Loop sincronizado con desfase fijo**: ambos slots avanzan en paralelo manteniendo la diferencia inicial entre fechas (p.ej. A=2020 y B=2024 → tras un tick A=2021, B=2025). Útil para ver evolución temporal de dos años distintos lado a lado.
3. **Loop independiente por slot**: cada uno con su propio intervalo y dirección. Probablemente innecesario.

Recomendación: arrancar por la (2) porque es la que da valor diferencial al swipe. Implica que el loop guarde un offset entre A y B en lugar de un valor absoluto.

## V2.2 — InfoBox y clicks en swipe

Hoy InfoBox está oculto en swipe. Habilitarlo requiere:

- Determinar bajo cuál pane está el cursor en el momento del click (comparar `clientX` con `swipePosition * width`)
- El click va al `MapView` de ese pane y el InfoBox lee del snapshot de ese slot
- Estilo del InfoBox: badge "A" o "B" en el header para que quede claro de qué slot vienen los datos
- Marker de click respeta el slot (color asociado A/B)

Riesgo: si el usuario arrastra la barra justo sobre el cursor, el pane debajo cambia. El handler debe leer la posición en el momento del click, no en el render.

## V2.3 — Mediciones en swipe

`MeasurementTools` está bloqueado en swipe. Para habilitarlo:

- Las mediciones viven en `useMapDrawing`, sobre un `VectorLayer` único atado a `mapRef` global. En swipe hay dos mapas, el `mapRef` global no aplica.
- Opciones:
    - **Mediciones globales**: dibujar en una capa vector compartida que se renderice en ambos panes (mismo `VectorSource` con dos `VectorLayer` montados, uno por pane). Más simple.
    - **Mediciones por slot**: cada pane con su propia capa. Permite medir sobre lo que cada lado muestra independientemente. Más complejo, dudoso valor.
- Recomendación: globales. La medición es geográfica, no depende de qué capa esté abajo.

## V2.4 — ZenMode en swipe

`ZenMode` colapsa toda la UI para dejar el mapa limpio. En swipe:

- Esconder selector de slot, leyenda chip, etiquetas de pane
- Mantener barra divisora visible (es la herramienta principal)
- Mantener etiquetas de A/B reducidas en esquinas para no perder referencia
- Salir de ZenMode debe seguir funcionando con la misma combinación de teclas

Bajo riesgo, mayoritariamente CSS y condicionar render de overlays.

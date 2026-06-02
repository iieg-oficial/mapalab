# Pendiente — Avisos multi-punto por capa (híbrido)

> Estado: **PLANEADO, no implementado**. Feature posterior al fix de "aviso por punto + zoom".

Permitir varios avisos anclados a coordenada en una misma capa, con presentación
**híbrida por punto** (cada punto elige si se muestra abierto o como marcador que
abre al interactuar). No toca el `notice` singular actual.

## Modelo de datos

Columna nueva, separada del `notice` actual:

```sql
ALTER TABLE mapalab.layers ADD COLUMN point_notices JSONB NOT NULL DEFAULT '[]'::jsonb;
```

Shape de cada item:

```json
{
  "id": "pn_a1b2c3",
  "displayMode": "pin",            // "pin" | "open"  (default: "pin")
  "enabled": true,
  "title": "...", "description": "...", "icon": "...",
  "variant": "info", "size": "large", "arrowPosition": "bottom",
  "anchorCoord": { "lon": -103.3, "lat": 20.6 },
  "zoomRange": { "min": 10, "max": 16 },
  "validFrom": null, "validUntil": null,
  "dismissible": true, "dismissPersistence": "permanent",
  "cta": { "label": "...", "url": "..." }
}
```

## Render del visor (UX)

- `displayMode: "open"` → tarjeta anclada abierta (comportamiento actual).
- `displayMode: "pin"` → marcador con icono/color de la variante; abre el popover
  (`AnchoredNotice` + `NoticeMessage`) al hover (desktop) / tap (mobile).
  **Un popover de pin a la vez.**
- Ambos modos conviven en la misma capa.
- Mobile: los "open" degradan a viewport `top-center` con `MOBILE_VISIBLE_LIMIT=2`
  + botón "+N" (ya existe); los "pin" abren bottom-sheet (`SwipeUpWrapper`).
- Componente nuevo `PointMarker` (overlay del pin) + reuso de
  `AnchoredNotice` / `NoticeMessage` / `NoticeArrow`.

## Editor (mariachi admin)

- Mini-mapa unificado multi-marker: pines numerados/coloreados por variante,
  **arrastrables** (`Translate`) para reposicionar.
- Lista lateral sincronizada (seleccionar → resalta y centra; click en mapa →
  fija el punto en edición o crea uno nuevo).
- Extraer `NoticeContentFields` de `LayerNoticeSection` (reuso singular + por punto)
  + selector `displayMode` por item + `ZoomRangeField` por item.
- `NoticeStandalone` / `LayerEditPage` guardan `pointNotices` por PUT parcial
  → aparece igual en capas y en eventos vía `CapasField`.

## Decisiones tomadas (defaults)

1. Dismiss key: `mapalab.notice.dismissed.<layerId>.<noticeId>.<hash>`;
   el singular usa `noticeId="_layer"` (reset único e inocuo de dismisses previos).
2. Límite: 20 puntos por capa.
3. `displayMode` default = `pin`.
4. `id` lo genera el frontend (`pn_` + random corto).
5. Telemetría nueva: `layer_notice_marker_click`, más `noticeId` en `view/dismiss/cta`.

## Orden de implementación (~5-7 días)

1. Migración + schema (`LayerPointNotice`) + `layer_tree_service` expone `pointNotices`.
2. Runtime: `pickActiveNotices` suma `pointNotices` + dismiss key con `noticeId` + clasificación open/pin.
3. Render: `PointMarker` + popover hover/tap + un-popover-a-la-vez + mobile.
4. Telemetría.
5. Editor: `NoticeContentFields` → mapa unificado multi-marker con drag → wiring.
6. QA desktop/mobile + preview.

Fases 1-3 entregan la funcionalidad visible; la 5 es el grueso.

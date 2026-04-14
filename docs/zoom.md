# Zoom

Propiedades de zoom en las definiciones de capas.

## defaultZoom

Zoom automatico al activar una capa.

### Formatos

**Nivel de zoom fijo** — centra en Jalisco al nivel indicado:

```javascript
defaultZoom: 12
```

**Zoom con centro especifico** — coordenadas `[lon, lat]`:

```javascript
defaultZoom: { zoom: 14, center: [-103.34, 20.67] }
```

**Ajuste automatico (extent)** — bounding box `[minLon, minLat, maxLon, maxLat]`, calcula zoom y centro para que entre completo en pantalla:

```javascript
defaultZoom: { extent: [-103.5, 20.5, -103.2, 20.8] }
```

### Comportamiento

- Solo aplica al **activar** la capa manualmente (click del usuario)
- **No aplica** al cargar capas desde URL (`skipAnalytics = true`)
- **No revierte** el zoom al desactivar la capa
- Si la capa no tiene `defaultZoom`, el mapa mantiene su vista actual

## zoomRange

Rango de zoom en el que la capa es visible. Fuera del rango, OpenLayers no renderiza ni solicita tiles.

### Formatos

```javascript
zoomRange: { min: 10 }          // visible de zoom 10 en adelante
zoomRange: { max: 14 }          // visible hasta zoom 14
zoomRange: { min: 10, max: 16 } // visible entre zoom 10 y 16
```

### Comportamiento

- Se aplica como `minZoom`/`maxZoom` en el `ImageLayer` de OpenLayers
- La capa sigue activa en el panel, solo deja de verse en el mapa fuera del rango
- Funciona bien en combinacion con `defaultZoom` para llevar al usuario al rango correcto

## Boton "Centrar en Jalisco"

En los controles del mapa, al pasar el cursor sobre el boton de zoom-in (+) aparece un boton adicional con icono de viewfinder que resetea la vista a los bounds de Jalisco (`zoom: 8`, `center: [-103.585, 20.85]`).

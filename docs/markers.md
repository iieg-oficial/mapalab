# Markers

Hook `useMapMarker` para mostrar marcadores temporales con icono en el mapa.

## API

Disponible desde `useMapsContext()`:

```javascript
const { showMarker, showMarkers, hideMarker, hideAllMarkers } = useMapsContext();
```

### showMarker

```javascript
showMarker({
    id: 'mi_marcador',              // opcional, default: '_default'
    center: [-103.39, 20.67],       // [lon, lat] — requerido
    zoom: 16,                       // opcional, anima el mapa al nivel indicado
    icon: mapalabSquareIcon,        // opcional, SVG importado o ruta publica
    scale: 1,                       // opcional, escala del icono (default: 1)
    anchor: [0.5, 1],              // opcional, punto de anclaje del icono (default: [0.5, 1])
    minZoom: 11,                   // opcional, zoom minimo para que el marcador sea visible
    maxZoom: 18,                   // opcional, zoom maximo para que el marcador sea visible
    duration: 5000                  // opcional, ms antes de ocultarse automaticamente
});
```

### showMarkers

```javascript
showMarkers([
    { id: 'a', center: [-103.5, 20.7], icon: eventoIcon },
    { id: 'b', center: [-104.0, 21.1], icon: eventoIcon }
]);
```

### hideMarker / hideAllMarkers

```javascript
hideMarker('mi_marcador');
hideAllMarkers();
```

## En definiciones de capas

Propiedad `marker` (objeto o array). Se muestra al activar la capa y se oculta al desactivarla.

**Marcador unico:**

```javascript
{
    id: 'oficina_iieg',
    label: 'IIEG',
    wmsConfig: createLayer('...'),
    marker: {
        center: [-103.39, 20.67],
        zoom: 16,
        icon: mapalabSquareIcon,
        minZoom: 11
    }
}
```

**Multiples marcadores:**

```javascript
{
    id: 'eventos_temporada',
    label: 'Eventos',
    wmsConfig: createLayer('...'),
    marker: [
        { center: [-103.5, 20.7], icon: eventoIcon },
        { center: [-104.0, 21.1], icon: eventoIcon }
    ]
}
```

## Logo IIEG en el sider

Click en el logo IIEG del sider muestra el marcador de MapaLab sobre la ubicacion del instituto (`[-103.4195, 20.6597]`) y hace zoom a nivel 16. El marcador solo es visible desde zoom 11 en adelante.

## Comportamiento

- Los marcadores de capas solo se crean al activar **manualmente** (no desde URL)
- Se eliminan automaticamente al desactivar la capa
- `showMarker` directo (desde componentes) es independiente del ciclo de capas
- Cada marcador tiene `zIndex: 999`, siempre visible sobre las capas WMS
- `minZoom`/`maxZoom` controlan el rango de zoom en el que el marcador es visible

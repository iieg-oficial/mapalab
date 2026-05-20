# Plan — Migración de íconos al bucket del Acervo IIEG

## Contexto

Hoy el componente `frontend/src/components/Icon.jsx` consume íconos desde dos fuentes:

1. **`externalIcons`** (~109 archivos `.svg` importados desde `frontend/src/assets/icons/`). Se renderizan como `<img src={url} />`. **No soportan `currentColor`** — cada SVG trae su color hardcoded.
2. **`icons`** (objeto en `Icon.jsx`): SVG JSX inline. Se renderizan con `cloneElement(icon, { className })`. **Sí soportan `currentColor`** y herencia de color desde padres.

En sesiones futuras los archivos `.svg` se moverán al **bucket del Acervo IIEG** y se servirán como URLs externas. El componente `Icon` debe pasar de hacer `import xxx from './ico_xxx.svg'` a algo como `<Icon src="https://acervo.iieg/icons/ico_xxx.svg" />` (o resolución por nombre contra una tabla de URLs).

El problema central es que **5 de los 7 íconos centralizados en `icons`** (después de la sesión 2026-05-19) dependen de `currentColor` para tomar color del contexto. Si se sirvieran como `<img>` plano desde el bucket, perderían esa capacidad.

## Inventario tras la centralización

Después de mover los 6 SVG inline al objeto `icons` de `Icon.jsx`, las entradas hardcoded son:

| name | Color | Caso especial |
|---|---|---|
| `download` | currentColor | — |
| `close` | currentColor | — |
| `done` | currentColor | — |
| `undo` | currentColor | — |
| `opacity` | currentColor (mix con `fill="currentColor"`) | — |
| `alert_triangle` | currentColor | — |
| `pencil` | currentColor | — |
| `text` | currentColor | — |
| `bug` / `colibri` | currentColor | — |
| `tool_mediciones` | currentColor | — |
| `tool_swipe` | currentColor + `#FF8300` fijo en parte interna | **mix de colores** |
| `pin_fallback` | currentColor | tamaño dinámico (clase) |
| `pause_all` | currentColor (fill) | viewBox 12×14 |
| `swipe_handle_chevrons_h` | `white` fijo | dos variantes (H/V) |
| `swipe_handle_chevrons_v` | `white` fijo | — |
| `swipe_orientacion` | currentColor | rotación CSS dinámica |

Resumen:
- **Monocromáticos con currentColor**: 13 íconos.
- **Color fijo (no currentColor)**: 2 íconos (los chevrons del knob).
- **Mix (currentColor + color fijo)**: 1 ícono (`tool_swipe`).

Los ~109 íconos de `externalIcons` ya tienen color hardcoded en el SVG — para ellos cambiar a URL es transparente (siguen sin currentColor, igual que hoy).

## Estrategias para servir desde bucket

| Estrategia | Permite `currentColor` | Mix de colores | Animaciones internas | Carga | Complejidad |
|---|---|---|---|---|---|
| **A. `<img src={url}>`** (como hoy con externalIcons) | ❌ | ✅ | ❌ | nativa, con cache HTTP del navegador | nula |
| **B. CSS `mask-image: url()` + `bg-color: currentColor`** | ✅ (solo mono) | ❌ | ❌ | nativa | baja |
| **C. Fetch + render inline** (`<svg>{contenidoCargado}</svg>`) | ✅ | ✅ | ✅ | requiere loader + cache en memoria | media |
| **D. Componente externo tipo `react-svg`** | ✅ | ✅ | ✅ | dependencia adicional | baja (instalar) / media (configurar) |

### Estrategia recomendada: híbrida A + C

`<img>` (A) para todo lo que ya hoy es monocromático con color fijo (los ~109 `ico_*` actuales). **Fetch + inline** (C) para los íconos que necesitan `currentColor` o color mixto (los hardcodeados centralizados).

Esto permite:
- Cero overhead para el 87% del catálogo (íconos existentes).
- Comportamiento intacto para los íconos que dependen de contexto.
- Una sola dependencia hacia el bucket, sin abandonar el patrón actual.

## Diseño técnico propuesto (estrategia híbrida)

### Estructura del registro

En lugar de un solo objeto `externalIcons` con URLs, un registro tipado:

```js
const iconRegistry = {
    download:               { url: `${BUCKET}/ico_descargar.svg`,        mode: 'inline' },
    close:                  { url: `${BUCKET}/ico_cerrar_x.svg`,         mode: 'inline' },
    base_layers_normal:     { url: `${BUCKET}/ico_general_normal.svg`,   mode: 'img' },
    base_layers_hover:      { url: `${BUCKET}/ico_general_hover.svg`,    mode: 'img' },
    swipe_handle_chevrons_h:{ url: `${BUCKET}/ico_swipe_chevrons.svg`,   mode: 'img' },
};
```

- `mode: 'img'` → `<img src={url} className={className} />` — preserva el patrón actual de `externalIcons`.
- `mode: 'inline'` → fetch del SVG, render inline con `dangerouslySetInnerHTML` o parse.

### Loader inline con cache (en memoria + localStorage opcional)

```js
const svgCache = new Map();

const useSvgContent = (url) => {
    const [content, setContent] = useState(() => svgCache.get(url) ?? null);
    useEffect(() => {
        if (content !== null) return;
        let cancelled = false;
        fetch(url).then(r => r.text()).then(text => {
            const inner = extractSvgInner(text);
            svgCache.set(url, inner);
            if (!cancelled) setContent(inner);
        });
        return () => { cancelled = true; };
    }, [url, content]);
    return content;
};
```

`extractSvgInner` toma el string del SVG y devuelve solo el contenido interno (paths, sin la etiqueta `<svg>` raíz), para poder re-envolverlo con un `<svg>` que tenga el `className` correcto:

```jsx
const InlineSvgIcon = ({ url, className, viewBox = '0 0 24 24' }) => {
    const inner = useSvgContent(url);
    if (!inner) return <span className={className} aria-hidden="true" />;
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox={viewBox}
            fill="currentColor"
            stroke="currentColor"
            className={className}
            dangerouslySetInnerHTML={{ __html: inner }}
        />
    );
};
```

### Atributos del SVG raíz

Como cada ícono tiene su propio `viewBox`, `fill`/`stroke` por defecto, y particularidades (ej. `strokeWidth="2.5"`), conviene almacenarlos en el registro:

```js
download: {
    url: `${BUCKET}/ico_descargar.svg`,
    mode: 'inline',
    viewBox: '0 0 24 24',
    defaults: { fill: 'none', stroke: 'currentColor', strokeWidth: 2 },
},
pause_all: {
    url: `${BUCKET}/ico_pause_all.svg`,
    mode: 'inline',
    viewBox: '0 0 12 14',
    defaults: { fill: 'currentColor' },
},
```

Y `InlineSvgIcon` los aplica antes del `dangerouslySetInnerHTML`.

### Seguridad de `dangerouslySetInnerHTML`

- El SVG viene de **nuestro propio bucket** del IIEG. Riesgo de inyección controlado.
- Aun así, sanitizar el contenido recibido (eliminar `<script>`, atributos `on*`) con una pasada regex o con DOMPurify (~6 KB minified) antes de inyectar.
- Validar `Content-Type: image/svg+xml` en la respuesta.

### Cache

- **En memoria** (`Map` a nivel módulo) para la vida de la pestaña.
- **localStorage** opcional para persistir entre sesiones (cuidar tamaño — los SVG son chicos, ~1 KB cada uno; 200 íconos = ~200 KB). Conveniente si el bucket no tiene CDN agresivo.
- HTTP cache nativo del bucket sigue funcionando para cargas iniciales.

### Fallback ante fallo de red

- Si `fetch` falla, dejar el `<span>` placeholder vacío o mostrar un ícono de error genérico.
- Loggear silenciosamente; el ícono no es crítico.

### Migración paulatina

Para no romper nada en un solo cambio:

1. Subir el set actual de `assets/icons/*.svg` al bucket sin modificar el componente.
2. Implementar `InlineSvgIcon` y el registro con `mode`.
3. Migrar los 16 íconos hardcoded a `mode: 'inline'` apuntando al bucket. Mantener su definición JSX inline como fallback (`fallback: <svg>...</svg>` en el registro) hasta que el bucket esté validado en prod.
4. Cuando esté estable, eliminar los fallback JSX y vaciar el objeto `icons` de `Icon.jsx`.
5. Cambiar los ~109 `externalIcons` a apuntar al bucket con `mode: 'img'`. Eliminar los archivos físicos de `assets/icons/`.

Cada paso es deployable independientemente; permite rollback parcial.

## Casos especiales documentados

### `tool_swipe` (mix currentColor + #FF8300)

El SVG tiene `stroke="currentColor"` en el rectángulo exterior y `stroke="#FF8300"` en la línea divisora central y las flechas. Con `mode: 'inline'`, el SVG bruto preserva ambos colores; el componente solo aplica `className` que afecta `color` para que currentColor herede del contexto. **No requiere tratamiento especial**, funciona out-of-the-box con la estrategia C.

Con estrategia B (mask) **no funcionaría** — toda la silueta tomaría el color de fondo.

### `swipe_handle_chevrons_h` / `_v` (white fijo, dos variantes)

Idealmente se diseña una sola versión (la diseñadora ya tiene tarea en Taiga #504) y se rota por CSS desde el padre. Mientras tanto, las dos variantes pueden servirse con `mode: 'img'` (color blanco fijo siempre, no necesita herencia).

### `pause_all` (viewBox 12×14)

Mantener el `viewBox` exacto en el registro. La diferencia con un viewBox 24×24 estándar es solo cosmética: las proporciones de las barras se ajustan al área.

### Rotación dinámica (`swipe_orientacion`)

El padre aplica `className="rotate-90"` cuando el swipe es vertical. Con cualquier estrategia (inline o img), la rotación se aplica al elemento contenedor, no al contenido del SVG. **No requiere cambios**.

## Estimación

- Implementación del `InlineSvgIcon` + registro tipado: **3 puntos** (1 día).
- Migración del set actual + tests: **3 puntos** (1 día).
- Subir SVGs al bucket + configurar CDN/cache headers: **2 puntos** (infra).
- Validación en staging: **1 punto**.

Total: una historia ~**8 puntos** Frontend + 2 puntos Infra. Plantear cuando el bucket de Acervo tenga endpoint estable y CORS configurado para el dominio de Mapalab.

## Dependencias externas

- **Bucket del Acervo IIEG**: URL pública, CORS habilitado para `https://iieg.jalisco.gob.mx` y `https://iieg.jalisco.gob.mx/test`.
- **CSP**: agregar el origen del bucket a `img-src` y `connect-src` del meta CSP de [index.html](frontend/index.html).
- **Pipeline de subida de SVGs**: definir si los SVGs se versionan en el bucket (paths inmutables tipo `v1/ico_xxx.svg`) o se sirven con cache-busting por query string.

## Referencias

- Componente actual: [frontend/src/components/Icon.jsx](frontend/src/components/Icon.jsx)
- Registro actual: [frontend/src/assets/icons/index.js](frontend/src/assets/icons/index.js)
- Sesión donde se centralizaron los inline (2026-05-19): los 6 SVG embebidos en componentes específicos se movieron al objeto `icons` de `Icon.jsx`.

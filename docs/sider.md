# Sider

Contenedor lateral izquierdo de la app (sidebar). Aloja logo, boton de modo, badge de entorno, menus variables por ruta, y logo IIEG. Maneja tres estados visuales (colapsado / expandido / mobile) con transiciones animadas y proteccion contra colapso cuando hay menus flotantes abiertos.

## Estados

| Estado | Ancho | Trigger |
|---|---|---|
| Colapsado | 88px | Default desktop, `lockMode === 'collapsed'` |
| Expandido | 340px | Hover desktop, `lockMode === 'expanded'` |
| Mobile | 88px + sheet | `window.innerWidth < 768px`, `isZenMode`, `lockMode === 'mobile'` |

En mobile el Sider queda siempre colapsado; los menus se abren como bottom sheets (`MobileSheet`) por fuera del ancho del sider.

---

## Constantes

`constants/sider.js:1-16`

| Constante | Valor | Uso |
|---|---|---|
| `SIDER_COLLAPSED_WIDTH` | 88 | Ancho sin hover |
| `SIDER_EXPANDED_WIDTH` | 340 | Ancho con hover/expanded |
| `SIDER_MOBILE_WIDTH` | 88 | Ancho en mobile |
| `MOBILE_BREAKPOINT` | 768 | `window.innerWidth < X -> isMobile` |
| `SIDER_HOVER_DELAY_ENTER` | 150 | Delay antes de expandir |
| `SIDER_HOVER_DELAY_LEAVE_DEFAULT` | 200 | Delay antes de colapsar (sin menus abiertos) |
| `SIDER_HOVER_DELAY_LEAVE_WITH_MENU` | 500 | Delay si hay menus abiertos (da tiempo a mover mouse al menu flotante) |
| `SIDER_HOVER_DELAY_LEAVE_WITH_TOOLS` | 300 | Delay si el panel de herramientas esta visible |
| `SIDER_TRANSITION_DURATION` | 500 | Duracion CSS |
| `SIDER_TRANSITION_TIMING` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Curva de animacion |

---

## SiderContext

`contexts/SiderContext.jsx:1-274`

### Estado

```javascript
{
    width,                 // num: ancho actual en px
    isHovered,             // bool: mouse sobre el sider
    openMenusCount,        // int: cuantos menus flotantes registrados
    isMobile,              // bool: window < 768
    isOpen,                // bool: sheet mobile visible
    lockMode,              // 'auto' | 'expanded' | 'collapsed' | 'mobile'

    siderRef,              // ref al <aside>
    toolsButtonRef,        // ref al boton de herramientas

    registerOpenMenu,      // () => openMenusCount++
    unregisterOpenMenu,    // () => openMenusCount--
    toggleSider,           // solo mobile: toggle isOpen
    closeSider,            // solo mobile: isOpen = false
    toggleLock             // cicla lockMode (auto -> expanded -> collapsed -> mobile -> auto)
}
```

### `lockMode`

| Modo | Comportamiento hover | Ancho forzado |
|---|---|---|
| `'auto'` | Reactivo (150ms enter / 200-500ms leave) | `isHovered ? 340 : 88` |
| `'expanded'` | Ignorado | 340 |
| `'collapsed'` | Ignorado | 88 |
| `'mobile'` | Ignorado | 88 + sheet behavior en desktop |

El usuario cicla modos con `SiderModeButton` (icono que emerge solo en desktop al hover o si `lockMode !== 'auto'`).

```javascript
const toggleLock = () => {
    setLockMode(prev => {
        if (prev === 'auto')      { setIsHovered(true);  return 'expanded'; }
        if (prev === 'expanded')  { setIsHovered(false); return 'collapsed'; }
        if (prev === 'collapsed') { setIsHovered(false); return 'mobile'; }
        return 'auto';
    });
};
```

---

## registerOpenMenu / unregisterOpenMenu

Los `Panel` flotantes y los `MobileMenu` registran su apertura en el Sider para bloquear el auto-collapse por hover. Sin esto, al mover el mouse al menu (que flota fuera del `<aside>`), el Sider colapsaria y arrastraria el menu con el.

Uso automatico en `Panel.jsx:92-99` y `MobileMenu.jsx:16-23` cuando `registerInSider={true}`:

```javascript
useEffect(() => {
    if (open && registerInSider && siderContext) {
        siderContext.registerOpenMenu?.();
        return () => siderContext.unregisterOpenMenu?.();
    }
}, [open, registerInSider, siderContext]);
```

El hook interno `useSiderHover` lee `hasOpenMenus = openMenusCount > 0` y ajusta el delay de leave: **500ms** cuando hay menus, **200ms** cuando no.

---

## Estructura visual (top -> bottom)

```
┌─────────────────────────────┐
│ [Logo Mapalab]  [ModeButton]│  shrink-0: logo + boton de modo
│    [EnvBadge]               │  absolute: badge dev/test
├─────────────────────────────┤
│ ┌─────────────────────────┐ │  Grupo azul claro (primeros items)
│ │ Buscar     (menu)       │ │
│ │ Capas      (menu)       │ │
│ │ Medicion   (menu)       │ │
│ └─────────────────────────┘ │
│                             │
│  Capas activas  (menu)      │  Items sueltos
│  Importar       (menu)      │
│  Info           (menu)      │
│                             │
│  ... (scroll con fade mask) │
├─────────────────────────────┤
│ [Logo IIEG]                 │  shrink-0: footer
└─────────────────────────────┘
```

El `mask-image` aplica gradient en los bordes cuando hay overflow vertical (`MapSider.jsx:225-231`) para indicar scroll disponible.

---

## Hover behavior (desktop, `lockMode === 'auto'`)

```
Mouse enters sider
  -> handleMouseEnter
  -> setTimeout(setIsHovered(true), 150ms)
  -> width transicion 88 -> 340 (500ms cubic-bezier)

Mouse leaves sider (sin menus abiertos)
  -> handleMouseLeave
  -> setTimeout(setIsHovered(false), 200ms)
  -> width transicion 340 -> 88

Mouse leaves sider (CON menu abierto)
  -> setTimeout(setIsHovered(false), 500ms)   <- delay aumentado
  -> Usuario tiene tiempo de mover mouse al Panel flotante
  -> Si el mouse entra al Panel, el Sider permanece expandido
```

**Archivo:** `contexts/SiderContext.jsx:139-197` (`useSiderHover`).

---

## Mobile behavior

Activo cuando: `isMobile || isZenMode || lockMode === 'mobile'` (alias `treatAsMobile` en `MapSider.jsx:66`).

- **Sider siempre colapsado** (88px) hasta que el usuario interactue.
- **Toggle por logo:** tap corto en logo Mapalab -> `toggleSider()`. Long press 1000ms -> navega a `/`.
- **Sheet de contenido:** si `isOpen`, el sider expande a 340 y renderiza el contenido dentro.
- **Menus como bottom sheets:** `Panel` renderiza via `MobileSheet` en mobile (no portal flotante).
- **Body scroll lock:** al abrir sheets, `MobileSheet.jsx:55-60`.
- **Cierre automatico:** `useOutsideClick` cierra el sider si `isOpen && openMenusCount === 0`.
- **SiderModeButton oculto:** `MapSider.jsx:210` (`!isMobile`).

---

## Consumidores

### `useSider()` directo

| Componente | Uso |
|---|---|
| `MapSider.jsx` | Orquestador principal |
| `Panel.jsx` | `registerOpenMenu`, `isMobile` |
| `MobileMenu.jsx` | `registerOpenMenu`, excluye `siderRef` del outside-click |
| `useSiderMenuPosition.js` | `width` para posicionar menus flotantes |

### `useSiderAdaptivePosition()`

Hook que calcula `left`/`top` considerando el ancho del Sider. Usado para controles de mapa que deben desplazarse cuando el Sider expande.

```javascript
const { style, className } = useSiderAdaptivePosition({
    bottomOffset: 180,   // dist del bottom para detectar overlap
    leftOffset: 16,      // left si no hay overlap
    siderOffset: 28,     // left si overlap con sider
    anchorRef: null      // opcional: ancla a otro elemento
});
```

Consumidores: `MapControls.jsx:16` (botones de zoom), `ToolsPanel.jsx:42` (panel de medicion).

---

## Posicionamiento de menus flotantes

`hooks/useSiderMenuPosition.js:1-244`. Lo usa `Panel` cuando `variant === 'menu'`.

| Escenario | Placement |
|---|---|
| Desktop, cabe abajo | `right-start` (menu a la derecha del boton) |
| Desktop, no cabe abajo pero si arriba | `right-end` (flip vertical) |
| Mobile + `mobileFullscreen` | Fullscreen (sin fixed) |
| Mobile + `!mobileFullscreen` | Bottom-sheet |

Se re-calcula en `requestAnimationFrame` con debounce en `resize` y `scroll`.

---

## Transiciones CSS

Aplicadas en `MapSider.jsx:174-189`:

```javascript
<aside
    style={{
        transitionTimingFunction: SIDER_TRANSITION_TIMING,
        width: `${width}px`
    }}
    className="transition-all duration-500"
>
```

- **Ancho del aside:** 500ms cubic-bezier
- **Posicion de menus flotantes:** 500ms (misma timing function) en `useSiderMenuPosition.js:149`
- **Opacity de menus al montar:** 150ms (evita flicker antes de que `isReady` confirme posicion final)

---

## Integraciones externas

| Contexto | Uso |
|---|---|
| `SearchContext` | `shouldAutoOpenSearch` -> MapSider expande y auto-abre menu `search` (`MapSider.jsx:57, 68-77`) |
| `ZenModeContext` | `isZenMode` fuerza `treatAsMobile` |
| `MapsContext` | `loadingLayers`, `dateLoops`, `isLocating` para spinners en items |

---

## Archivos clave

| Archivo | Responsabilidad |
|---|---|
| `contexts/SiderContext.jsx` | Estado global, `useSiderHover`, `useSiderAdaptivePosition` |
| `constants/sider.js` | Anchos, delays, transiciones |
| `pages/maps/components/MapSider.jsx` | Render del sider para `/maps` |
| `pages/maps/components/SiderModeButton.jsx` | Boton de ciclo de `lockMode` |
| `pages/maps/components/EnvBadge.jsx` | Badge dev/test |
| `components/Panel.jsx` | Menus flotantes, registra apertura |
| `components/MobileSheet.jsx` | Bottom sheet base con scroll lock |
| `pages/maps/components/MobileMenu.jsx` | Variante mobile de Panel |
| `hooks/useSiderMenuPosition.js` | Calculo de posicion de menus |

---

## Patrones comunes

### Menu que no deja colapsar el sider

```jsx
<Panel
    registerInSider={true}
    variant="menu"
    anchorRef={buttonRef}
    open={isOpen}
    onClose={handleClose}
>
    {content}
</Panel>
```

### Boton flotante que respeta el ancho del sider

```jsx
const { style, className } = useSiderAdaptivePosition({ bottomOffset: 100 });
return <button style={style} className={className}>...</button>;
```

### Menu independiente del sider (floating libre)

```jsx
<Panel
    registerInSider={false}
    variant="floating"
    open={isOpen}
    onClose={handleClose}
>
    {content}
</Panel>
```

# MobileSheet

Primitivo reutilizable para paneles tipo bottom-sheet en mobile. Centraliza portal, backdrop, animacion `translateY`, Escape, click-fuera y body scroll lock.

**Ruta:** `frontend/src/components/MobileSheet.jsx`

## Cuando usar

- Cualquier panel que en mobile deba ocupar el ancho total y subir desde abajo
- Reemplazo de modales flotantes que no se acomodan bien en pantallas pequenas
- Contenido scrollable con indicadores de overflow (combinado con `useScrollOverflow`)

Si ademas necesitas integracion con el sider (que clicks dentro del sider no cierren el sheet, o que el sheet registre su apertura contra `openMenusCount`), usa `MobileMenu` que es un wrapper sobre `MobileSheet`.

## API

```jsx
<MobileSheet
    open={boolean}
    onClose={() => void}
    excludeRefs={[ref, ...]}         // opcional: refs cuyos clicks NO cierran el sheet
    sheetClassName={string}          // opcional: clases extra del contenedor del sheet
    backdropClassName={string}       // opcional: clases extra del backdrop
    maxHeightClass={string}          // opcional: default 'max-h-[85vh]'
    lockBodyScroll={boolean}         // opcional: default true
    closeOnEscape={boolean}          // opcional: default true
    closeOnClickOutside={boolean}    // opcional: default true
>
    {children}
    {/* o render-prop: */}
    {({ close }) => <Contenido onCerrar={close} />}
</MobileSheet>
```

### Props

| Prop | Tipo | Default | Proposito |
|---|---|---|---|
| `open` | `boolean` | — | Controla visibilidad. Si `false` retorna `null` (no renderiza) |
| `onClose` | `() => void` | — | Se llama al cerrar (Escape, click fuera, tap en backdrop) |
| `excludeRefs` | `Ref[]` | `[]` | Clicks dentro de estos refs no cuentan como "click fuera". Util para triggers persistentes |
| `sheetClassName` | `string` | `''` | Se concatena al contenedor del sheet (fondo, bordes, sombras base ya aplicados) |
| `backdropClassName` | `string` | `''` | Se concatena al backdrop |
| `maxHeightClass` | `string` | `'max-h-[85vh]'` | Altura maxima del sheet |
| `lockBodyScroll` | `boolean` | `true` | Si `true` pone `document.body.style.overflow = 'hidden'` mientras esta abierto |
| `closeOnEscape` | `boolean` | `true` | Listener de tecla Escape |
| `closeOnClickOutside` | `boolean` | `true` | Listener `mousedown` + `touchstart` fuera del sheet |

### Export auxiliar

```jsx
import MobileSheet, { MobileSheetCloseButton } from '@components/MobileSheet';
```

`MobileSheetCloseButton` es un boton compacto con el icono `close` para colocar en el header del contenido.

## Comportamiento visual

- Portal a `document.body`, `z-50`
- Backdrop negro con opacidad 30%, transicion de opacidad 300ms
- Sheet anclado abajo: `bg-[#F9FBFF] rounded-t-2xl shadow-[0_-5px_20px_#1A26641A]`
- Entrada: `translateY(100% → 0)` con `transition-transform duration-300 ease-out`
- Layout interno del sheet: `flex flex-col overflow-hidden` — el consumidor define header/contenido/footer

## Ejemplos de uso

### Ejemplo minimo

```jsx
const [open, setOpen] = useState(false);

return (
    <>
        <button onClick={() => setOpen(true)}>Abrir</button>
        <MobileSheet open={open} onClose={() => setOpen(false)}>
            <div className="p-4">Contenido del panel</div>
        </MobileSheet>
    </>
);
```

### Con header fijo y contenido scrollable + indicadores

```jsx
const scrollRef = useRef(null);
const { canScrollUp, canScrollDown } = useScrollOverflow(scrollRef, { enabled: open });

<MobileSheet open={open} onClose={onClose}>
    <div className="px-4 pt-3 pb-2 flex items-center gap-2 shrink-0">
        <h3 className="font-bold">Detalles</h3>
        <MobileSheetCloseButton onClick={onClose} />
    </div>

    {canScrollUp && <ScrollHint direction="up" />}

    <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 pb-3">
        {items.map(...)}
    </div>

    {canScrollDown && <ScrollHint direction="down" />}
</MobileSheet>
```

### Con refs excluidos (trigger persistente)

Cuando el trigger que abre el sheet sigue visible (por ejemplo, un boton en el sider) y no quieres que hacer click en el cierre el panel:

```jsx
const triggerRef = useRef(null);

<>
    <button ref={triggerRef} onClick={toggle}>...</button>
    <MobileSheet open={open} onClose={close} excludeRefs={[triggerRef]}>
        ...
    </MobileSheet>
</>
```

### Con render-prop

```jsx
<MobileSheet open={open} onClose={close}>
    {({ close }) => (
        <>
            <Header onClose={close} />
            <Body />
        </>
    )}
</MobileSheet>
```

## Consumidores actuales

| Componente | Ruta | Notas |
|---|---|---|
| `MobileMenu` | `pages/maps/components/MobileMenu.jsx` | Wrapper con `registerInSider` + `excludeRefs=[siderRef]` |
| `InfoBox` (rama mobile) | `pages/maps/components/InfoBox/InfoBox.jsx` | Activado con `useSider().isMobile`. Combina con `useScrollOverflow` para mostrar "hay mas arriba/abajo" |

## Relacion con otros componentes

- **`MobileMenu`** — thin wrapper para el caso del sider. Si tu panel vive fuera del sider, usa `MobileSheet` directo.
- **`Panel`** (`components/Panel.jsx`) — dual-mode (flotante en desktop, fullscreen opcional en mobile). Para panels que necesitan anclaje a un elemento en desktop, usa `Panel`. Para comportamiento exclusivamente bottom-sheet, usa `MobileSheet`.
- **`Modal`** — modal centrado, no bottom-sheet. Usar para confirmaciones o dialogos cortos.

## Jerarquia z-index

- `MobileSheet` usa `z-50`, igual que `Panel`, `Modal` y `MobileMenu`
- En conflicto el orden del DOM decide cual queda arriba. Los ultimos en montarse ganan.
- El sider base esta en `z-20` (desktop) / `z-22` (mobile), asi que el sheet siempre queda por encima.

## Accesibilidad

- Cerrar con Escape (default)
- Backdrop clickeable para cerrar
- Considera agregar `role="dialog"` y `aria-modal="true"` al contenido del sheet si lo usas como modal bloqueante. El primitivo no los aplica por defecto para permitir semantica personalizada.

## Limitaciones conocidas

- No trae gestos de swipe-to-close (si lo necesitas, agregar encima del children)
- No hace focus trap automatico — si necesitas, usa los mismos patrones de `Panel` (focus en el primer focusable)
- Animacion de salida: el componente desmonta al pasar `open=false` sin animar la salida. Si quieres delay de animacion, controla `open` con un timeout en el consumidor

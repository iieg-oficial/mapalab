# Videos del visor

Graba recorridos del visor con zooms, cursor y ondas en los clics, sin editar a mano. Un **guion**
describe qué pasa; el **motor** maneja Chrome y captura cada cuadro; **Remotion** aplica la cámara.

```bash
demo/hacer.sh dia-de-muertos   # → demo/video/salida/dia-de-muertos.mp4
```

`hacer.sh` abre Chrome si no está abierto, graba, instala Remotion la primera vez y renderiza.
Mientras graba, **no toques ni minimices la ventana de Chrome**.

## Por qué así

- **Chrome con ventana, no headless.** El firewall de `iieg.jalisco.gob.mx` bloquea a Chrome
  headless («Web Page Blocked!»). El motor se conecta por el puerto 9222 a un Chrome normal con
  perfil propio (`~/.chrome-demo-mapalab`), que no toca tus sesiones.
- **Todo corre en la imagen de Playwright** (`pw.sh`): el `node` del sistema es un contenedor
  `node:26` sin las librerías de Chrome, y su `/tmp` es privado.
- **El viewport se emula a 1920×1080** mientras graba, así que el video mide eso aunque la ventana
  sea otra. La densidad se queda en 1×: el screencast no entrega más píxeles que los de la ventana
  real, aunque se emule 2×. Zooms de más de ×4 se empiezan a ver suaves.

## Un video nuevo

Crea `demo/guiones/<nombre>.mjs`:

```js
export default {
    url: 'https://iieg.jalisco.gob.mx/mapalab/mapa',
    cursor: { x: 700, y: 420 },          // dónde arranca el cursor
    viewport: { ancho: 1920, alto: 1080 }, // opcional; 1080×1920 da la vista de teléfono

    // No se graba: deja la página en el estado inicial (recargar, apagar cosas…).
    async preparar({ page, esperar }) {
        await page.reload({ waitUntil: 'load' });
        await esperar(4000);
    },

    // Se graba. La cámara se mueve con enfocar(); los clics llevan onda solos.
    async escena({ page, caja, centro, moverA, clic, enfocar, alejar, esperar }) {
        const boton = centro(await caja(page.getByRole('button', { name: 'Herramientas' })));
        enfocar(2.5, boton);       // zoom ×2.5 hacia el botón (transición de 0.8 s)
        await clic(boton);         // el cursor viaja y hace clic
        await esperar(1500);
        alejar();                  // regresa a la vista completa
        await esperar(1000);
    },
};
```

Herramientas que recibe el guion (`motor.mjs`):

| | |
|---|---|
| `enfocar(zoom, punto, dur)` / `alejar(dur)` | Mueve la cámara; cada llamada arranca desde donde esté |
| `moverA(punto, ms)` / `clic(punto, ms)` | Mueve el cursor con *ease*; `clic` además deja la onda |
| `seguir(locator, { ms, zoom })` | La cámara persigue un elemento que se mueve |
| `caja(locator)` / `cajas(locator)` | Cajas en pantalla; `centro()` y `union()` para combinarlas |
| `buscar(locator, cumple)` | Primer elemento cuya caja cumple una condición |

Elementos con `aria-hidden` (las decoraciones de temporada, por ejemplo) no los encuentra
`getByRole`: búscalos con `page.locator('button[aria-label="…"]')`.

## Ajustar sin regrabar

`cd demo/video && ../pw.sh npx remotion studio src/index.jsx` abre Remotion Studio para ver el
video y mover cosas de la cámara (`src/camara.js`) o las ondas (`src/Demo.jsx`). Para cambiar
tiempos o el recorrido hay que regrabar: está todo en el guion.

La grabación queda en `video/public/grabacion/<guion>/` (cuadros + `datos.json`) y el video en
`video/salida/`; ninguno se versiona.

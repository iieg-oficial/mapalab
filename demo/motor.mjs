// Motor de grabación: maneja el Chrome del usuario (puerto 9222), pinta un cursor, captura
// cada cuadro por CDP y anota los eventos de cámara y clic que luego aplica Remotion.
import fs from 'node:fs';
import path from 'node:path';

const { chromium } = await import(new URL('../frontend/node_modules/playwright/index.mjs', import.meta.url));

const CDP_URL = 'http://localhost:9222';

const CURSOR = () => {
    const poner = () => {
        if (document.getElementById('demo-cursor')) return;
        const c = document.createElement('div');
        c.id = 'demo-cursor';
        c.innerHTML = '<svg width="28" height="28" viewBox="0 0 28 28"><path d="M4 2 L4 22 L9.5 17 L13 25 L16.5 23.5 L13 15.5 L20.5 15.5 Z" fill="#fff" stroke="#111" stroke-width="1.6" stroke-linejoin="round"/></svg>';
        c.style.cssText = 'position:fixed;left:-50px;top:-50px;pointer-events:none;z-index:2147483647;'
            + 'transform-origin:4px 2px;transition:scale .12s;filter:drop-shadow(0 2px 3px #0006);margin:-2px 0 0 -4px';
        document.body.append(c);
        addEventListener('mousemove', (e) => { c.style.left = `${e.clientX}px`; c.style.top = `${e.clientY}px`; }, true);
        addEventListener('mousedown', () => { c.style.scale = '0.8'; }, true);
        addEventListener('mouseup', () => { c.style.scale = '1'; }, true);
    };
    if (document.body) poner();
    else addEventListener('DOMContentLoaded', poner);
};

export const centro = (b) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

export const union = (cajas) => {
    const x0 = Math.min(...cajas.map((b) => b.x));
    const y0 = Math.min(...cajas.map((b) => b.y));
    const x1 = Math.max(...cajas.map((b) => b.x + b.width));
    const y1 = Math.max(...cajas.map((b) => b.y + b.height));
    return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
};

const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);

const conectar = async (url) => {
    const navegador = await chromium.connectOverCDP(CDP_URL).catch(() => {
        throw new Error(`No hay Chrome en ${CDP_URL}. Usa demo/hacer.sh, que lo abre, o ver demo/README.md.`);
    });
    const contexto = navegador.contexts()[0];
    const origen = new URL(url).origin;
    let page = contexto.pages().find((p) => p.url().startsWith(origen));
    if (!page) {
        page = await contexto.newPage();
        await page.goto(url, { waitUntil: 'load' });
    }
    await page.bringToFront();
    return { contexto, page };
};

// Herramientas que recibe cada guion. Los tiempos se anotan con el reloj del sistema, el mismo
// que usa Chrome para sellar los cuadros del screencast.
const herramientas = (page, viewport) => {
    const ahora = () => Date.now() / 1000;
    const camara = [];
    const clics = [];
    const medio = { x: viewport.ancho / 2, y: viewport.alto / 2 };
    let mouse = { ...medio };

    const esperar = (ms) => page.waitForTimeout(ms);
    const cajas = async (locator) => (await Promise.all((await locator.all()).map((l) => l.boundingBox()))).filter(Boolean);
    const caja = async (locator) => (await cajas(locator))[0];

    // Cada paso cuesta un viaje por CDP: se avanza contra el reloj y no por un número fijo de pasos.
    const moverA = async ({ x, y }, ms = 500) => {
        const desde = { ...mouse };
        const t0 = Date.now();
        for (;;) {
            const k = Math.min(1, (Date.now() - t0) / ms);
            const e = easeInOut(k);
            await page.mouse.move(desde.x + (x - desde.x) * e, desde.y + (y - desde.y) * e);
            if (k === 1) break;
            await esperar(12);
        }
        mouse = { x, y };
    };

    const clic = async (punto, ms = 350) => {
        await moverA(punto, ms);
        clics.push({ t: ahora(), x: punto.x, y: punto.y });
        await page.mouse.down();
        await esperar(70);
        await page.mouse.up();
    };

    const enfocar = (zoom, punto = medio, dur = 0.8) => camara.push({ t: ahora(), zoom, x: punto.x, y: punto.y, dur });
    const alejar = (dur = 0.8) => enfocar(1, medio, dur);

    // Mantiene la cámara sobre un elemento que se mueve (una flor que cae, un marcador animado).
    const seguir = async (locator, { ms = 2000, zoom = 3 } = {}) => {
        const fin = Date.now() + ms;
        let primera = true;
        while (Date.now() < fin) {
            const b = await locator.boundingBox();
            if (b) enfocar(zoom, centro(b), primera ? 0.8 : 0.4);
            primera = false;
            await esperar(150);
        }
    };

    // Primer elemento del locator cuya caja cumple la condición.
    const buscar = async (locator, cumple = () => true) => {
        for (const l of await locator.all()) {
            const b = await l.boundingBox();
            if (b && cumple(b)) return l;
        }
        return null;
    };

    const ponerMouse = async (punto) => {
        mouse = { ...punto };
        await page.mouse.move(punto.x, punto.y);
    };

    return {
        page, viewport, esperar, cajas, caja, moverA, clic, enfocar, alejar, seguir, buscar, centro, union,
        ponerMouse, eventos: { camara, clics },
    };
};

// El viewport se emula para que el video mida lo mismo sea cual sea la ventana. La densidad se
// queda en 1: el screencast no entrega más píxeles que los de la ventana real, aunque se emule 2×.
const emular = async (cdp, page, { ancho, alto }) => {
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: ancho, height: alto, deviceScaleFactor: 1, mobile: false });
    const [w, h] = await page.evaluate(() => [innerWidth, innerHeight]);
    if (w !== ancho || h !== alto) throw new Error(`La emulación no se aplicó: el viewport mide ${w}×${h} y no ${ancho}×${alto}`);
};

export const grabar = async (guion, salida) => {
    const viewport = { ancho: 1920, alto: 1080, ...guion.viewport };
    const { contexto, page } = await conectar(guion.url);
    const cdp = await contexto.newCDPSession(page);

    await contexto.addInitScript(CURSOR);
    await emular(cdp, page, viewport);

    const h = herramientas(page, viewport);
    try {
        if (guion.preparar) await guion.preparar(h);
        // Se reaplica: una pestaña recién abierta por Playwright puede soltar la emulación al navegar.
        await emular(cdp, page, viewport);
        await page.evaluate(CURSOR);
        await h.ponerMouse(guion.cursor || { x: viewport.ancho / 2, y: viewport.alto / 2 });
        await h.esperar(800);

        fs.rmSync(salida, { recursive: true, force: true });
        fs.mkdirSync(salida, { recursive: true });
        const cuadros = [];
        cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
            const archivo = `${String(cuadros.length).padStart(5, '0')}.jpg`;
            fs.writeFileSync(path.join(salida, archivo), Buffer.from(data, 'base64'));
            cuadros.push({ archivo, t: metadata.timestamp });
            await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
        });
        await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: viewport.ancho, maxHeight: viewport.alto });
        await h.esperar(300);
        // Un movimiento mínimo garantiza un cuadro inicial aunque la página esté quieta.
        await page.mouse.move(1, 1);
        await h.ponerMouse(guion.cursor || { x: viewport.ancho / 2, y: viewport.alto / 2 });
        const inicio = Date.now() / 1000;

        await guion.escena(h);

        await cdp.send('Page.stopScreencast');
        await h.esperar(200);
        const datos = { ...viewport, inicio, fin: Date.now() / 1000, cuadros, ...h.eventos };
        fs.writeFileSync(path.join(salida, 'datos.json'), JSON.stringify(datos, null, 1));
        return datos;
    } finally {
        await cdp.send('Emulation.clearDeviceMetricsOverride').catch(() => {});
    }
};

import { spawn } from 'node:child_process';
import { chromium } from 'playwright';

const PORT = Number(process.env.SMOKE_PORT || 4173);
const RUTAS = ['', 'mapa', 'catalogo'];
const ARRANQUE_MS = 60000;
const MONTAJE_MS = 20000;
const RUIDO_DE_RED = /failed to fetch|networkerror|load failed|err_connection|net::|status of 40|status of 50/i;
const BOUNDARY = /Error capturado por React Router/i;

const esperarUrl = (proceso) => new Promise((resolve, reject) => {
    const temporizador = setTimeout(
        () => reject(new Error(`vite preview no publicó su URL en ${ARRANQUE_MS / 1000} s`)),
        ARRANQUE_MS,
    );
    let salida = '';
    const leer = (chunk) => {
        salida += chunk.toString();
        const encontrada = salida.match(/http:\/\/localhost:\d+\/\S*/);
        if (encontrada) {
            clearTimeout(temporizador);
            resolve(encontrada[0].replace(/\/?$/, '/'));
        }
    };
    proceso.stdout.on('data', leer);
    proceso.stderr.on('data', leer);
    proceso.on('exit', (codigo) => {
        clearTimeout(temporizador);
        reject(new Error(`vite preview terminó con código ${codigo}\n${salida}`));
    });
});

const revisarRuta = async (navegador, url) => {
    const contexto = await navegador.newContext();
    const pagina = await contexto.newPage();
    const excepciones = [];
    const capturadas = [];
    pagina.on('pageerror', (error) => {
        if (!RUIDO_DE_RED.test(error.message)) excepciones.push(error.message);
    });
    pagina.on('console', (mensaje) => {
        if (mensaje.type() === 'error' && BOUNDARY.test(mensaje.text())) capturadas.push(mensaje.text());
    });

    let montada = true;
    try {
        await pagina.goto(url, { waitUntil: 'domcontentloaded', timeout: MONTAJE_MS });
        await pagina.waitForFunction(
            () => document.getElementById('root')?.childElementCount > 0,
            null,
            { timeout: MONTAJE_MS },
        );
    } catch {
        montada = false;
    }

    const pantallaFatal = await pagina.locator('#mapalab-hard-reload').count() > 0;
    const titulo = await pagina.title();
    await contexto.close();

    const fallos = [];
    if (!montada) fallos.push('#root se quedó sin contenido: la app no montó');
    if (pantallaFatal) fallos.push('se renderizó la pantalla de recuperación de error-recovery.js');
    if (excepciones.length) fallos.push(`excepciones sin capturar: ${excepciones.join(' | ')}`);
    if (capturadas.length) fallos.push(`el error boundary atrapó un fallo de render: ${capturadas.join(' | ')}`);
    return { url, titulo, fallos };
};

const abrirNavegador = async () => {
    try {
        const navegadorDelSistema = await chromium.launch({ channel: 'chrome' });
        console.log('navegador: Chrome del sistema');
        return navegadorDelSistema;
    } catch {
        const empaquetado = await chromium.launch();
        console.log('navegador: Chromium de Playwright');
        return empaquetado;
    }
};

const preview = spawn(
    'npx',
    ['vite', 'preview', '--port', String(PORT), '--strictPort'],
    { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NO_COLOR: '1' } },
);

let navegador;
let codigoSalida = 0;

try {
    const base = await esperarUrl(preview);
    console.log(`preview en ${base}`);
    navegador = await abrirNavegador();

    const resultados = [];
    for (const ruta of RUTAS) {
        resultados.push(await revisarRuta(navegador, `${base}${ruta}`));
    }

    for (const { url, titulo, fallos } of resultados) {
        if (fallos.length) {
            codigoSalida = 1;
            console.error(`FALLA  ${url}`);
            fallos.forEach((f) => console.error(`       ${f}`));
        } else {
            console.log(`ok     ${url}  «${titulo}»`);
        }
    }

    if (codigoSalida === 0) {
        console.log(`\n${resultados.length} rutas montaron sin errores.`);
    } else {
        console.error('\nEl bundle compila pero no arranca en el navegador.');
    }
} catch (error) {
    codigoSalida = 1;
    console.error(`No se pudo correr el smoke test: ${error.message}`);
    if (/executable doesn't exist|shared libraries|channel/i.test(error.message)) {
        console.error('Falta un navegador. Instala google-chrome-stable, o corre'
            + ' `npx playwright install --with-deps chromium`.');
    }
} finally {
    await navegador?.close();
    preview.kill('SIGTERM');
}

process.exit(codigoSalida);

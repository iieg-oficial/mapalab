// Uso: node grabar.mjs <guion>   (los guiones viven en demo/guiones/)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { grabar } from './motor.mjs';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const nombre = process.argv[2];
if (!nombre) {
    console.error('Uso: node grabar.mjs <guion>');
    process.exit(1);
}

const { default: guion } = await import(path.join(aqui, 'guiones', `${nombre}.mjs`));
const datos = await grabar(guion, path.join(aqui, 'video', 'public', 'grabacion', nombre));
console.log(`${nombre}: ${datos.cuadros.length} cuadros, ${(datos.fin - datos.inicio).toFixed(1)} s, `
    + `${datos.camara.length} movimientos de cámara, ${datos.clics.length} clics`);
process.exit(0);

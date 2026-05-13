import { IiegMapalab } from './element.js';


const define = (name, ctor) => {
    if (!customElements.get(name)) customElements.define(name, ctor);
};

define('iieg-mapalab', IiegMapalab);

if (typeof window !== 'undefined') {
    if (!window.iiegMapalab) window.iiegMapalab = {};
    window.iiegMapalab.version = '1.0.0';
}

export { IiegMapalab };

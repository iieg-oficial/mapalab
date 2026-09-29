const MAX_LOTES = 12;

export const loteAceptado = (estado) => estado === 'beacon' || (Number.isInteger(estado) && estado >= 200 && estado < 300);

const listeners = new Set();

const vacio = () => ({ sesion: null, cola: 0, porEvento: {}, lotes: [] });

let snapshot = vacio();

const publicar = (parche) => {
    snapshot = { ...snapshot, ...parche };
    listeners.forEach(fn => fn());
};

const conteoDe = (porEvento, nombre) => porEvento[nombre] || { encolados: 0, aceptados: 0, rechazados: 0, perdidos: 0 };

const sumar = (porEvento, nombres, campo) => {
    const siguiente = { ...porEvento };
    nombres.forEach(nombre => {
        const actual = conteoDe(siguiente, nombre);
        siguiente[nombre] = { ...actual, [campo]: actual[campo] + 1 };
    });
    return siguiente;
};

export const telemetryDebugStore = {
    encolar(nombre, sesion, cola) {
        publicar({ sesion, cola, porEvento: sumar(snapshot.porEvento, [nombre], 'encolados') });
    },
    lote({ eventos, estado, rechazados = [], perdido = false, cola }) {
        const nombres = eventos.map(evento => evento.eventName);
        const nombresRechazados = rechazados.map(indice => nombres[indice]);
        const aceptados = loteAceptado(estado) ? nombres : [];
        let porEvento = sumar(snapshot.porEvento, aceptados, 'aceptados');
        porEvento = sumar(porEvento, nombresRechazados, 'rechazados');
        if (perdido) porEvento = sumar(porEvento, nombres.filter((_, i) => !rechazados.includes(i)), 'perdidos');
        const lote = {
            hora: new Date(),
            estado,
            enviados: nombres.length,
            rechazados: [...new Set(nombresRechazados)],
            perdido,
        };
        publicar({ cola, porEvento, lotes: [lote, ...snapshot.lotes].slice(0, MAX_LOTES) });
    },
    limpiar() {
        publicar({ ...vacio(), sesion: snapshot.sesion, cola: snapshot.cola });
    },
    getSnapshot() {
        return snapshot;
    },
    subscribe(fn) {
        listeners.add(fn);
        return () => listeners.delete(fn);
    },
};

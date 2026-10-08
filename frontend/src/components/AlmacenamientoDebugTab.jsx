import { useEffect, useMemo, useState } from 'react';
import {
    borrarLlave, borrarPropias, formatoBytes, leerAlmacen, valorLegible,
} from '@services/storageDebug';

const INTERVALO_MS = 1000;

const TIPOS = [{ clave: 'local', texto: 'local' }, { clave: 'session', texto: 'session' }];

const firmaDe = (entradas) => entradas.map(e => `${e.llave}\u0000${e.valor}`).join('\u0001');

const useAlmacenes = () => {
    const [datos, setDatos] = useState(() => ({ local: leerAlmacen('local'), session: leerAlmacen('session') }));

    useEffect(() => {
        const refrescar = () => setDatos(previo => {
            const siguiente = { local: leerAlmacen('local'), session: leerAlmacen('session') };
            const igual = firmaDe(previo.local) === firmaDe(siguiente.local)
                && firmaDe(previo.session) === firmaDe(siguiente.session);
            return igual ? previo : siguiente;
        });
        const intervalo = window.setInterval(refrescar, INTERVALO_MS);
        window.addEventListener('storage', refrescar);
        return () => {
            window.clearInterval(intervalo);
            window.removeEventListener('storage', refrescar);
        };
    }, []);

    return datos;
};

const Fila = ({ entrada, abierta, onAlternar, onBorrar }) => (
    <div className="border-b border-gray-800 last:border-0">
        <div className="flex items-center gap-2 px-3 py-1">
            <button type="button" onClick={onAlternar} className="flex-1 min-w-0 flex items-center gap-1.5 text-left cursor-pointer">
                <span className="text-gray-500">{abierta ? '▾' : '▸'}</span>
                <span className={`truncate ${entrada.propia ? 'text-yellow-400' : 'text-gray-400'}`}>{entrada.llave}</span>
            </button>
            <span className="text-gray-500 text-[10px] shrink-0">{formatoBytes(entrada.bytes)}</span>
            <button
                type="button"
                onClick={() => navigator.clipboard?.writeText(entrada.valor ?? '')}
                title="Copiar el valor"
                className="text-gray-400 hover:text-white cursor-pointer"
            >
                ⧉
            </button>
            <button type="button" onClick={onBorrar} title="Borrar la llave" className="text-gray-400 hover:text-red-400 cursor-pointer">
                ✕
            </button>
        </div>
        {abierta && (
            <pre className="mx-3 mb-1.5 max-h-40 overflow-auto rounded bg-gray-800 p-2 text-[10px] text-blue-300 whitespace-pre-wrap break-all select-text">
                {valorLegible(entrada.valor)}
            </pre>
        )}
    </div>
);

const AlmacenamientoDebugTab = () => {
    const datos = useAlmacenes();
    const [tipo, setTipo] = useState('local');
    const [filtro, setFiltro] = useState('');
    const [soloPropias, setSoloPropias] = useState(true);
    const [abierta, setAbierta] = useState(null);

    const entradas = useMemo(() => {
        const texto = filtro.trim().toLowerCase();
        return datos[tipo]
            .filter(e => !soloPropias || e.propia)
            .filter(e => !texto || e.llave.toLowerCase().includes(texto));
    }, [datos, filtro, soloPropias, tipo]);

    const totalDe = (clave) => formatoBytes(datos[clave].reduce((suma, e) => suma + e.bytes, 0));

    const borrarTodoYRecargar = () => {
        if (!window.confirm(`¿Borrar las llaves de mapalab de ${tipo}Storage y recargar?`)) return;
        borrarPropias(tipo);
        window.location.reload();
    };

    return (
        <div className="rounded-b-xl">
            <div className="flex gap-1.5 px-3 pt-2">
                {TIPOS.map(({ clave, texto }) => (
                    <button
                        key={clave}
                        type="button"
                        onClick={() => { setTipo(clave); setAbierta(null); }}
                        className={`px-2 py-0.5 rounded-full cursor-pointer ${tipo === clave ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                    >
                        {texto} {datos[clave].length} · {totalDe(clave)}
                    </button>
                ))}
            </div>
            <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700">
                <input
                    value={filtro}
                    onChange={evento => setFiltro(evento.target.value)}
                    placeholder="Filtrar llaves…"
                    className="flex-1 min-w-0 rounded-full bg-gray-800 px-2.5 py-0.5 text-white placeholder:text-gray-500 focus:outline-none"
                />
                <label className="flex items-center gap-1 text-gray-400 cursor-pointer shrink-0">
                    <input type="checkbox" checked={soloPropias} onChange={evento => setSoloPropias(evento.target.checked)} />
                    solo mapalab
                </label>
            </div>

            <div className="max-h-72 overflow-y-auto">
                {entradas.length === 0 ? (
                    <p className="text-gray-500 px-3 py-3 text-center">Sin llaves</p>
                ) : entradas.map(entrada => (
                    <Fila
                        key={entrada.llave}
                        entrada={entrada}
                        abierta={abierta === entrada.llave}
                        onAlternar={() => setAbierta(actual => (actual === entrada.llave ? null : entrada.llave))}
                        onBorrar={() => borrarLlave(tipo, entrada.llave)}
                    />
                ))}
            </div>

            <div className="px-3 py-2 border-t border-gray-700">
                <button type="button" onClick={borrarTodoYRecargar} className="px-2.5 py-0.5 rounded-full bg-gray-700 hover:bg-red-900 cursor-pointer">
                    Borrar lo de mapalab y recargar
                </button>
            </div>
        </div>
    );
};

export default AlmacenamientoDebugTab;

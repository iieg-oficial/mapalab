import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const sinAcentos = (texto) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

const MunicipioPicker = ({ municipios, excluidas, onElegir, onCerrar, cargando, posicion, anclaRef }) => {
    const [busqueda, setBusqueda] = useState('');
    const cajaRef = useRef(null);
    const entradaRef = useRef(null);

    useEffect(() => {
        entradaRef.current?.focus();
        const fuera = (evento) => {
            if (cajaRef.current?.contains(evento.target)) return;
            if (anclaRef?.current?.contains(evento.target)) return;
            onCerrar();
        };
        const escape = (evento) => { if (evento.key === 'Escape') onCerrar(); };
        document.addEventListener('mousedown', fuera);
        document.addEventListener('keydown', escape);
        return () => {
            document.removeEventListener('mousedown', fuera);
            document.removeEventListener('keydown', escape);
        };
    }, [onCerrar, anclaRef]);

    const resultados = useMemo(() => {
        const excluir = new Set(excluidas);
        const aguja = sinAcentos(busqueda.trim());
        return municipios
            .filter(m => !excluir.has(String(m.clave)))
            .filter(m => !aguja || sinAcentos(m.nombre).includes(aguja))
            .slice(0, 40);
    }, [municipios, excluidas, busqueda]);

    if (!posicion) return null;

    return createPortal(
        <div
            ref={cajaRef}
            className="fixed z-[60] w-52 rounded-[10px] bg-white shadow-[0_5px_20px_#1A26641A] p-2 font-garet"
            style={{ left: posicion.izquierda, bottom: posicion.abajo }}
            role="dialog"
            aria-label="Elegir municipio"
        >
            <input
                ref={entradaRef}
                type="text"
                value={busqueda}
                onChange={(evento) => setBusqueda(evento.target.value)}
                placeholder="Buscar municipio"
                className="w-full rounded-md border border-[#DDE4F2] px-2 py-1 text-[11px]/[14px] text-[#2E4372] outline-none focus:border-purple"
            />
            <p className="mt-1.5 mb-1 text-[9px]/[11px] text-[#8894AE]">
                O elígelo directamente en el mapa.
            </p>
            <ul className="max-h-40 overflow-auto scrollbar-thin">
                {cargando && <li className="px-2 py-1 text-[10px] text-[#8894AE]">Cargando…</li>}
                {!cargando && resultados.length === 0 && (
                    <li className="px-2 py-1 text-[10px] text-[#8894AE]">Sin coincidencias</li>
                )}
                {resultados.map(municipio => (
                    <li key={municipio.clave}>
                        <button
                            type="button"
                            onClick={() => onElegir(String(municipio.clave))}
                            className="w-full text-left px-2 py-1 rounded text-[11px]/[14px] text-[#2E4372] hover:bg-[#EFF3FC] cursor-pointer truncate"
                        >
                            {municipio.nombre}
                        </button>
                    </li>
                ))}
            </ul>
        </div>,
        document.body,
    );
};

export default MunicipioPicker;

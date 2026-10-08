import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@components/Icon';
import ScrollContainer from '@components/ScrollContainer';
import { useDebounce } from '@hooks/useDebounce';

const normalize = (str) => String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const Opcion = ({ nombre, clave, onSelect }) => (
    <div className="w-full flex items-center gap-1 rounded-lg transition group hover:bg-orange/10">
        <button
            type="button"
            onClick={onSelect}
            className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 text-left cursor-pointer"
        >
            <span className="flex-1 min-w-0 block text-[13px]/[19px] font-garet tracking-normal truncate text-[#454545] group-hover:text-purple">
                {nombre}
            </span>
            <span className="text-[10px] font-garet text-gray-400 tabular-nums shrink-0">{clave}</span>
        </button>
    </div>
);

const MunicipioPicker = ({ municipios, excluidas, onElegir, onCerrar, cargando, posicion, anclaRef }) => {
    const [busqueda, setBusqueda] = useState('');
    const consulta = useDebounce(busqueda, 200);
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
        const q = normalize(consulta.trim());
        return municipios
            .filter(m => !excluir.has(String(m.clave)))
            .filter(m => !q || normalize(m.nombre).includes(q) || String(m.clave).includes(q));
    }, [municipios, excluidas, consulta]);

    if (!posicion) return null;

    return createPortal(
        <div
            ref={cajaRef}
            className="fixed z-[60] w-72 flex flex-col px-4 pt-3 pb-3 rounded-[14px] bg-[#F9FBFF] shadow-[0_5px_20px_#1A26641A]"
            style={{ left: posicion.izquierda, bottom: posicion.abajo }}
            role="dialog"
            aria-label="Agregar municipio a la comparación"
        >
            <div className="flex items-center justify-between mb-3 gap-2 shrink-0">
                <h3 className="block text-[15px]/[20px] font-garet font-bold text-purple tracking-normal">
                    Agregar municipio
                </h3>
                <button
                    type="button"
                    onClick={onCerrar}
                    className="size-7 shrink-0 flex items-center justify-center rounded-full text-purple hover:bg-purple hover:text-white transition cursor-pointer"
                    aria-label="Cerrar el selector"
                >
                    <Icon name="close" className="size-4" />
                </button>
            </div>

            <div className="relative mb-3 shrink-0">
                <input
                    ref={entradaRef}
                    type="text"
                    value={busqueda}
                    onChange={(evento) => setBusqueda(evento.target.value)}
                    placeholder="Buscar municipio"
                    className="w-full py-3 pl-4 pr-14 border-none bg-[#EAEFFA] rounded-lg text-[13px]/[19px] text-purple font-garet font-normal tracking-normal placeholder:text-[#191919] placeholder:font-garet placeholder:text-[13px]/[19px] focus:outline-purple transition-colors"
                />
                <span
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-12.75 bg-purple-deep rounded-r-lg flex items-center justify-center pointer-events-none"
                    aria-hidden="true"
                >
                    <Icon name="searchInput" />
                </span>
            </div>

            <ScrollContainer className="max-h-56 -mx-1 px-1" overlayFade overlayColor="#F9FBFF">
                {cargando && <p className="px-2 py-1 text-[12px] font-garet text-gray-500">Cargando…</p>}
                {!cargando && resultados.length === 0 && (
                    <p className="px-2 py-1 text-[12px] font-garet text-gray-500">Sin coincidencias</p>
                )}
                {resultados.map(municipio => (
                    <Opcion
                        key={municipio.clave}
                        nombre={municipio.nombre}
                        clave={municipio.clave}
                        onSelect={() => onElegir(String(municipio.clave))}
                    />
                ))}
            </ScrollContainer>
        </div>,
        document.body,
    );
};

export default MunicipioPicker;

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@components/Icon';
import ScrollContainer from '@components/ScrollContainer';

const ANCHO = 256;
const SEPARACION = 8;

const DropdownPill = ({ valor, onCambio, opciones, etiqueta, className = '', multiple = false, resumen }) => {
    const [posicion, setPosicion] = useState(null);
    const anclaRef = useRef(null);

    const abierto = posicion !== null;
    const elegidas = multiple ? (Array.isArray(valor) ? valor : []) : [valor];
    const actual = multiple ? null : opciones.find(o => o.valor === valor);
    const texto = multiple
        ? (resumen ? resumen(elegidas) : `${elegidas.length} seleccionados`)
        : (actual?.texto || '—');

    const alternar = (opcion) => {
        if (!multiple) {
            onCambio(opcion.valor);
            setPosicion(null);
            return;
        }
        const dentro = elegidas.includes(opcion.valor);
        if (dentro && elegidas.length === 1) return;
        onCambio(dentro ? elegidas.filter(v => v !== opcion.valor) : [...elegidas, opcion.valor]);
    };

    const ubicar = useCallback(() => {
        const rect = anclaRef.current?.getBoundingClientRect();
        if (!rect) return;
        setPosicion({
            izquierda: Math.min(
                Math.max(SEPARACION, rect.left),
                window.innerWidth - ANCHO - SEPARACION,
            ),
            abajo: window.innerHeight - rect.top + SEPARACION,
        });
    }, []);

    useEffect(() => {
        if (!abierto) return undefined;
        const fuera = (evento) => {
            if (anclaRef.current?.contains(evento.target)) return;
            if (evento.target.closest?.('[data-dropdown-pill]')) return;
            setPosicion(null);
        };
        const escape = (evento) => { if (evento.key === 'Escape') setPosicion(null); };
        document.addEventListener('mousedown', fuera);
        document.addEventListener('keydown', escape);
        window.addEventListener('resize', ubicar);
        return () => {
            document.removeEventListener('mousedown', fuera);
            document.removeEventListener('keydown', escape);
            window.removeEventListener('resize', ubicar);
        };
    }, [abierto, ubicar]);

    return (
        <span className={`relative inline-flex ${className}`}>
            <button
                ref={anclaRef}
                type="button"
                onClick={() => (abierto ? setPosicion(null) : ubicar())}
                aria-label={etiqueta}
                aria-expanded={abierto}
                aria-haspopup="listbox"
                className={`h-7 flex items-center gap-2 max-w-52 pl-3 pr-2.5 rounded-lg border bg-[#EAEFFA] font-garet text-[12px]/[16px] font-bold text-purple tracking-normal transition-colors cursor-pointer ${abierto ? 'border-purple' : 'border-[#EAEFFA] hover:border-purple'}`}
            >
                <span className="truncate">{texto}</span>
                <Icon name="chevron" className={`size-2.5 shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`} />
            </button>

            {abierto && createPortal(
                <div
                    data-dropdown-pill=""
                    role="listbox"
                    aria-multiselectable={multiple || undefined}
                    aria-label={etiqueta}
                    className="fixed z-[60] w-64 max-w-[80vw] px-2 py-2 rounded-[14px] bg-[#F9FBFF] shadow-[0_5px_20px_#1A26641A]"
                    style={{ left: posicion.izquierda, bottom: posicion.abajo }}
                >
                    <ScrollContainer className="max-h-52" overlayFade overlayColor="#F9FBFF">
                        {opciones.map(opcion => {
                            const elegida = elegidas.includes(opcion.valor);
                            return (
                                <button
                                    key={opcion.valor}
                                    type="button"
                                    role="option"
                                    aria-selected={elegida}
                                    onClick={() => alternar(opcion)}
                                    className={`w-full flex items-center gap-2 text-left px-2 py-1.5 rounded-lg font-garet text-[13px]/[19px] tracking-normal transition cursor-pointer ${elegida
                                        ? 'bg-[#FFF3E6] text-purple font-bold'
                                        : 'text-[#454545] hover:bg-orange/10 hover:text-purple'}`}
                                >
                                    {multiple && (
                                        <span
                                            className={`size-3 shrink-0 rounded-[3px] border grid place-items-center ${elegida ? 'bg-purple border-purple' : 'border-[#C6CFE2]'}`}
                                            aria-hidden="true"
                                        >
                                            {elegida && <Icon name="done" className="size-2 text-white" />}
                                        </span>
                                    )}
                                    <span className="truncate">{opcion.texto}</span>
                                </button>
                            );
                        })}
                    </ScrollContainer>
                </div>,
                document.body,
            )}
        </span>
    );
};

export default DropdownPill;

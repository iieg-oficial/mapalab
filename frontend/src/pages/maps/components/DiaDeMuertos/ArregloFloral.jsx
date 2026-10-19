import { useState } from 'react';
import { createPortal } from 'react-dom';
import Cempasuchil from './Cempasuchil';
import Maceta from './Maceta';
import Maravilla from './Maravilla';
import { ARREGLO_CONTRAIDO, ARREGLO_EXPANDIDO, varianteAlAzar } from './macetas';

const HOJA = 'M0 0 C6 -5 15 -5 22 0 C15 5 6 5 0 0 Z';

const variantesPara = (arreglo) => Object.fromEntries(
    arreglo.flores.filter((f) => f.tipo === 'maravilla').map((f) => [f.id, varianteAlAzar()]),
);

const caja = ({ cx, cy, size }) => ({ left: `${cx - size / 2}px`, top: `${cy - size / 2}px`, width: `${size}px`, height: `${size}px` });

const Flor = ({ tipo, variante }) => (
    tipo === 'maravilla'
        ? <Maravilla variante={variante} className="size-full" />
        : <Cempasuchil className="size-full" />
);

const ArregloFloral = ({ expandido }) => {
    const arreglo = expandido ? ARREGLO_EXPANDIDO : ARREGLO_CONTRAIDO;
    const [variantes] = useState(() => ({ ...variantesPara(ARREGLO_EXPANDIDO), ...variantesPara(ARREGLO_CONTRAIDO) }));
    const [caidas, setCaidas] = useState([]);
    const tumbadas = new Set(caidas.map((c) => c.id));

    const tumbar = (flor, e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setCaidas((prev) => [...prev, {
            id: flor.id,
            tipo: flor.tipo,
            variante: variantes[flor.id],
            left: rect.left,
            top: rect.top,
            size: rect.width,
            dx: flor.caida,
            dy: window.innerHeight - rect.bottom,
        }]);
    };

    return (
        <>
            <div
                className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2"
                style={{ width: `${arreglo.ancho}px`, height: `${arreglo.alto}px` }}
            >
                <svg viewBox={`0 0 ${arreglo.ancho} ${arreglo.alto}`} className="absolute inset-0 size-full overflow-visible" aria-hidden="true">
                    <g stroke="#5E8A44" strokeWidth="1.2" fill="none" strokeLinecap="round">
                        {arreglo.tallos.map((d) => <path key={d} d={d} />)}
                    </g>
                    {arreglo.hojas.map(({ x, y, r, w }) => (
                        <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${r}) scale(${w / 22})`}>
                            <path d={HOJA} fill="#5E8A44" />
                            <path d="M2 0 H19" stroke="#3F6B2F" strokeWidth="0.8" />
                        </g>
                    ))}
                </svg>
                {arreglo.flores.map((flor) => {
                    if (tumbadas.has(flor.id)) return null;
                    const dibujo = <Flor tipo={flor.tipo} variante={variantes[flor.id]} />;
                    if (!expandido) return <span key={flor.id} className="absolute" style={caja(flor)}>{dibujo}</span>;
                    return (
                        <button
                            key={flor.id}
                            type="button"
                            aria-label="Tumbar flor"
                            onClick={(e) => tumbar(flor, e)}
                            className="pointer-events-auto absolute rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-purple"
                            style={caja(flor)}
                        >
                            {dibujo}
                        </button>
                    );
                })}
                {arreglo.macetas.map(({ id, left, top, w, h }) => (
                    <Maceta key={id} style={{ left: `${left}px`, top: `${top}px`, width: `${w}px`, height: `${h}px` }} />
                ))}
            </div>
            {caidas.length > 0 && createPortal(
                caidas.map((c) => (
                    <span
                        key={c.id}
                        aria-hidden="true"
                        className="muertos-flor-cortada pointer-events-none fixed z-[25]"
                        style={{ left: `${c.left}px`, top: `${c.top}px`, width: `${c.size}px`, height: `${c.size}px`, '--muertos-dx': `${c.dx}px`, '--muertos-dy': `${c.dy}px` }}
                    >
                        <Flor tipo={c.tipo} variante={c.variante} />
                    </span>
                )),
                document.body,
            )}
        </>
    );
};

export default ArregloFloral;

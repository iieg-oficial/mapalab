import { useState } from 'react';
import { createPortal } from 'react-dom';
import Maravilla from './Maravilla';
import RamaSvg from './RamaSvg';
import { RAMO_CONTRAIDO, RAMO_EXPANDIDO, varianteAlAzar } from './ramos';

const variantesPara = (ramo) => Object.fromEntries(ramo.flores.map((f) => [f.id, varianteAlAzar()]));

const estiloFlor = ({ cx, cy, size }) => ({ left: `${cx - size / 2}px`, top: `${cy - size / 2}px`, width: `${size}px`, height: `${size}px` });

const RamoMaravillas = ({ expandido }) => {
    const ramo = expandido ? RAMO_EXPANDIDO : RAMO_CONTRAIDO;
    const [variantes] = useState(() => ({ expandido: variantesPara(RAMO_EXPANDIDO), contraido: variantesPara(RAMO_CONTRAIDO) }));
    const [caidas, setCaidas] = useState([]);
    const delRamo = variantes[expandido ? 'expandido' : 'contraido'];
    const cortadas = new Set(caidas.map((c) => c.id));

    const cortar = (flor, e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setCaidas((prev) => [...prev, {
            id: flor.id,
            variante: delRamo[flor.id],
            left: rect.left,
            top: rect.top,
            size: rect.width,
            dx: flor.dx,
            dy: window.innerHeight - rect.bottom,
        }]);
    };

    return (
        <>
            <div
                className="pointer-events-none absolute left-1/2 -translate-x-1/2"
                style={{ top: `${ramo.top}px`, width: `${ramo.ancho}px`, height: `${ramo.alto}px` }}
            >
                <RamaSvg ramo={ramo} />
                {ramo.flores.map((flor) => {
                    const dibujo = <Maravilla variante={delRamo[flor.id]} className={`size-full ${flor.lenta ? 'muertos-flor-lenta' : ''}`} />;
                    if (!expandido) return <span key={flor.id} className="absolute" style={estiloFlor(flor)}>{dibujo}</span>;
                    if (cortadas.has(flor.id)) return null;
                    return (
                        <button
                            key={flor.id}
                            type="button"
                            aria-label="Cortar flor"
                            onClick={(e) => cortar(flor, e)}
                            className="pointer-events-auto absolute rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-purple"
                            style={estiloFlor(flor)}
                        >
                            {dibujo}
                        </button>
                    );
                })}
            </div>
            {caidas.length > 0 && createPortal(
                caidas.map((c) => (
                    <span
                        key={c.id}
                        aria-hidden="true"
                        className="muertos-flor-cortada pointer-events-none fixed z-[25]"
                        style={{ left: `${c.left}px`, top: `${c.top}px`, width: `${c.size}px`, height: `${c.size}px`, '--muertos-dx': `${c.dx}px`, '--muertos-dy': `${c.dy}px` }}
                    >
                        <Maravilla variante={c.variante} className="size-full" />
                    </span>
                )),
                document.body,
            )}
        </>
    );
};

export default RamoMaravillas;

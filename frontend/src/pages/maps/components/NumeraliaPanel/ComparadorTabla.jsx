import { useCallback, useEffect, useRef, useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { COLORES_COMPARADOR } from '@pages/maps/helpers/coloresComparador';
import MunicipioPicker from './MunicipioPicker';

const ANCHO_COLUMNA = 74;
const ANCHO_PICKER = 208;
const SEPARACION = 8;

const Ventaja = ({ fila }) => {
    if (fila.ventaja === null) return null;
    const texto = fila.enPuntos
        ? `+${fila.ventaja.toFixed(1)}`
        : `+${formatNumber(String(Math.round(fila.ventaja)))}`;
    return <span className="ml-0.5 text-[9px]/[10px] font-bold text-[#B85C00] align-super">{texto}</span>;
};

const Celda = ({ celda, marcada, fila }) => {
    if (celda.texto === null) {
        return <span className="text-right text-[11px]/[14px] text-[#A9B4CC] tabular-nums">—</span>;
    }
    const clases = marcada
        ? 'bg-[#EDE3F3] rounded text-purple -mx-1 px-1'
        : 'text-[#2E4372]';
    return (
        <span className={`text-right text-[11px]/[14px] font-bold tabular-nums ${clases}`}>
            {celda.porcentaje === null ? formatNumber(String(celda.texto)) : celda.texto}
            {marcada && <Ventaja fila={fila} />}
        </span>
    );
};

const Encabezado = ({ columna, indice, onQuitar, sePuedeQuitar }) => (
    <span className="flex flex-col gap-px pb-1 border-b border-[#DEE6F4] min-w-0">
        <span className="flex items-center justify-between gap-1">
            <span className="size-1.5 rounded-[2px] shrink-0" style={{ background: COLORES_COMPARADOR[indice % COLORES_COMPARADOR.length] }} />
            {sePuedeQuitar && (
                <button
                    type="button"
                    onClick={() => onQuitar(columna.clave)}
                    aria-label={`Quitar ${columna.nombre} de la comparación`}
                    className="text-[#A9B4CC] hover:text-purple transition cursor-pointer leading-none"
                >
                    <Icon name="close" className="size-2" />
                </button>
            )}
        </span>
        <span className="text-[10px]/[12px] font-bold text-[#2E4372] text-right truncate" title={columna.nombre}>
            {columna.nombre}
        </span>
    </span>
);

const ComparadorTabla = ({ columnas, filas, modo, onModo, onQuitar, picker, vacio }) => {
    const plantilla = `minmax(96px,1fr) repeat(${columnas.length}, ${ANCHO_COLUMNA}px) 20px`;
    const masRef = useRef(null);
    const [posicion, setPosicion] = useState(null);

    const ubicar = useCallback(() => {
        const rect = masRef.current?.getBoundingClientRect();
        if (!rect) return;
        setPosicion({
            izquierda: Math.min(
                Math.max(SEPARACION, rect.right - ANCHO_PICKER),
                window.innerWidth - ANCHO_PICKER - SEPARACION,
            ),
            abajo: window.innerHeight - rect.top + SEPARACION,
        });
    }, []);

    useEffect(() => {
        if (!picker.abierto) { setPosicion(null); return undefined; }
        ubicar();
        window.addEventListener('resize', ubicar);
        return () => window.removeEventListener('resize', ubicar);
    }, [picker.abierto, ubicar]);

    const botonMas = (
        <Tooltip content="Agregar municipio">
            <button
                type="button"
                ref={masRef}
                onClick={picker.onAlternar}
                aria-expanded={picker.abierto}
                aria-label="Agregar un municipio a la comparación"
                className={`size-4 flex items-center justify-center rounded-full transition cursor-pointer ${picker.abierto ? 'bg-purple text-white' : 'text-purple hover:bg-[#EFF3FC]'}`}
            >
                <span className="text-[13px]/[13px] font-medium">+</span>
            </button>
        </Tooltip>
    );

    const caja = picker.abierto && (
        <MunicipioPicker
            municipios={picker.municipios}
            excluidas={picker.excluidas}
            onElegir={picker.onElegir}
            onCerrar={picker.onCerrar}
            cargando={picker.cargando}
            posicion={posicion}
            anclaRef={masRef}
        />
    );

    if (columnas.length === 0) {
        return (
            <div className="flex items-center gap-2 py-2">
                <p className="text-[11px]/[14px] font-garet text-[#8894AE]">{vacio}</p>
                {botonMas}
                {caja}
            </div>
        );
    }

    return (
        <div className="grid gap-x-2 gap-y-1 items-end" style={{ gridTemplateColumns: plantilla }}>
            <span className="flex items-end pb-1 border-b border-[#DEE6F4]">
                <span className="inline-flex rounded-full overflow-hidden border border-[#DCE3F0] bg-white text-[9px]/[11px] font-semibold">
                    {['mas', 'menos'].map(valor => (
                        <button
                            key={valor}
                            type="button"
                            onClick={() => onModo(valor)}
                            aria-pressed={modo === valor}
                            className={`px-2 py-0.5 cursor-pointer transition ${modo === valor ? 'bg-purple text-white' : 'text-[#5C6B8C] hover:bg-[#EFF3FC]'}`}
                        >
                            {valor === 'mas' ? '▲ más' : '▼ menos'}
                        </button>
                    ))}
                </span>
            </span>

            {columnas.map((columna, indice) => (
                <Encabezado
                    key={columna.clave}
                    columna={columna}
                    indice={indice}
                    onQuitar={onQuitar}
                    sePuedeQuitar={columnas.length > 1}
                />
            ))}

            <span className="flex items-end justify-center pb-1 border-b border-[#DEE6F4]">
                {botonMas}
            </span>

            {filas.map(fila => (
                <Fila key={fila.nombre} fila={fila} />
            ))}

            {caja}
        </div>
    );
};

const Fila = ({ fila }) => (
    <>
        <span className={`text-[10px]/[13px] ${fila.esBase ? 'font-bold text-[#2E4372] pb-1 border-b border-[#E9EEF8]' : 'text-[#465055]'}`}>
            {fila.nombre}
        </span>
        {fila.celdas.map((celda, indice) => (
            <span key={indice} className={fila.esBase ? 'pb-1 border-b border-[#E9EEF8] flex justify-end' : 'flex justify-end'}>
                <Celda celda={celda} marcada={fila.marcada === indice} fila={fila} />
            </span>
        ))}
        <span className={fila.esBase ? 'border-b border-[#E9EEF8]' : ''} />
    </>
);

export default ComparadorTabla;

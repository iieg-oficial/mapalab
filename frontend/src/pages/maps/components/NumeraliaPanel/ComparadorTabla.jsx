import { useCallback, useEffect, useRef, useState } from 'react';
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import Icon from '@components/Icon';
import Segmented from '@components/Segmented';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import ComparadorColumna from './ComparadorColumna';
import MunicipioPicker from './MunicipioPicker';

const ANCHO_COLUMNA = 78;
const ANCHO_PICKER = 288;
const SEPARACION = 8;

const CAJA = 'grid grid-cols-[1fr_34px] gap-1 items-center w-full px-1 py-0.5 rounded-md border';

const Celda = ({ celda, fila, indice }) => {
    if (celda.bruto === null) {
        return (
            <span className={`${CAJA} border-transparent`}>
                <span className="text-right text-[11px]/[14px] font-garet text-[#A9B4CC] tabular-nums">—</span>
                <span />
            </span>
        );
    }

    const esAlto = fila.alto?.columna === indice;
    const esBajo = fila.bajo?.columna === indice;
    const marca = esAlto
        ? { borde: 'border-[#24573F]', tono: 'text-[#24573F]', signo: '+', ventaja: fila.alto.ventaja }
        : esBajo
            ? { borde: 'border-[#8B2B3D]', tono: 'text-[#8B2B3D]', signo: '−', ventaja: fila.bajo.ventaja }
            : null;
    const conDiferencia = Boolean(marca && marca.ventaja > 0);

    return (
        <span className={`${CAJA} ${conDiferencia ? marca.borde : 'border-transparent'}`}>
            <span className="text-right font-garet text-[15px]/[22px] font-bold tabular-nums text-[#191919]">
                {formatNumber(String(celda.bruto))}
            </span>
            <span className="flex flex-col items-start justify-center leading-none">
                <span className="h-[11px] text-[9px]/[11px] text-gray-400 tabular-nums">
                    {celda.porcentaje === null ? '' : `${celda.porcentaje.toFixed(1)}%`}
                </span>
                <span className={`h-[11px] text-[9px]/[11px] font-bold tabular-nums ${marca ? marca.tono : ''}`}>
                    {conDiferencia
                        ? `${marca.signo}${fila.enPuntos ? marca.ventaja.toFixed(1) : formatNumber(String(Math.round(marca.ventaja)))}`
                        : ''}
                </span>
            </span>
        </span>
    );
};

const Fila = ({ fila }) => (
    <>
        <span className={`sticky left-0 z-[2] bg-[#F9FBFF] pr-2 self-center flex items-center text-[11px]/[14px] font-garet ${fila.esBase ? 'font-bold text-[#2E4372]' : 'text-[#465055]'}`}>
            {fila.nombre}
        </span>
        {fila.celdas.map((celda, indice) => (
            <span key={indice} className="flex items-center self-center">
                <Celda celda={celda} fila={fila} indice={indice} />
            </span>
        ))}
    </>
);

const ComparadorTabla = ({ columnas, filas, onQuitar, onReordenar, picker, vacio, vistaGrafica, onVistaGrafica, children }) => {
    const masRef = useRef(null);
    const [posicion, setPosicion] = useState(null);

    const sensores = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    );

    const ubicar = useCallback(() => {
        const rect = masRef.current?.getBoundingClientRect();
        if (!rect) return;
        setPosicion({
            izquierda: Math.min(
                Math.max(SEPARACION, rect.left),
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

    const alSoltar = ({ active, over }) => {
        if (!over || active.id === over.id) return;
        const desde = columnas.findIndex(c => c.clave === active.id);
        const hasta = columnas.findIndex(c => c.clave === over.id);
        if (desde < 0 || hasta < 0) return;
        onReordenar(arrayMove(columnas.map(c => c.clave), desde, hasta));
    };

    const botonMas = (
        <button
            type="button"
            onClick={picker.onAlternar}
            aria-expanded={picker.abierto}
            aria-label="Agregar un municipio a la comparación"
            className={`flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-full border text-[11px]/[14px] font-garet font-bold transition-colors cursor-pointer ${picker.abierto
                ? 'bg-purple text-white border-purple'
                : 'bg-white text-purple border-purple hover:bg-purple-soft'}`}
        >
            <Icon name="crear" className="size-3.5" />
            <span className="max-md:hidden">Agregar municipio</span>
        </button>
    );

    const segmento = (
        <Segmented
            compact
            ariaLabel="Forma de ver la comparación"
            value={vistaGrafica ? 'grafica' : 'tabla'}
            onChange={(v) => onVistaGrafica(v === 'grafica')}
            options={[
                { value: 'tabla', icon: 'tabla', tooltip: 'Ver como tabla' },
                { value: 'grafica', icon: 'grafica', tooltip: 'Ver como gráfica' },
            ]}
        />
    );

    const controles = (
        <div className="flex items-center gap-2">
            <span ref={masRef} className="flex shrink-0">{botonMas}</span>
            {segmento}
        </div>
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
            <div>
                <div className="flex items-center gap-2 py-1">
                    <span ref={masRef} className="flex shrink-0">{botonMas}</span>
                    <p className="text-[11px]/[14px] font-garet text-[#8894AE]">{vacio}</p>
                </div>
                {caja}
            </div>
        );
    }

    if (vistaGrafica) {
        return (
            <div>
                <div className="mb-2">{controles}</div>
                {children}
                {caja}
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensores}
            collisionDetection={closestCenter}
            onDragEnd={alSoltar}
            modifiers={[restrictToHorizontalAxis]}
        >
            <div
                className="grid gap-x-3 gap-y-2 items-end font-garet overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 pb-1"
                style={{ gridTemplateColumns: `minmax(150px,max-content) repeat(${columnas.length}, ${ANCHO_COLUMNA}px)` }}
            >
                <span className="sticky left-0 z-[3] bg-[#F9FBFF] pr-2 pb-1">{controles}</span>

                <SortableContext items={columnas.map(c => c.clave)} strategy={horizontalListSortingStrategy}>
                    {columnas.map((columna, indice) => (
                        <ComparadorColumna
                            key={columna.clave}
                            columna={columna}
                            indice={indice}
                            onQuitar={onQuitar}
                            sePuedeQuitar={columnas.length > 1}
                        />
                    ))}
                </SortableContext>

                {filas.map(fila => <Fila key={fila.nombre} fila={fila} />)}
            </div>
            {caja}
        </DndContext>
    );
};

export default ComparadorTabla;

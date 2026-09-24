import { useRef } from 'react';
import Icon from '@components/Icon';
import PanelHeader from '@components/PanelHeader';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { formatAreaValue, formatLengthValue } from '@pages/maps/helpers/formatMeasure';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { useDraggablePanel } from '../InfoBox/hooks/useDraggablePanel';
import GraficaAlturas from './GraficaAlturas';

const ENCABEZADOS = {
    punto: { titulo: 'Altura del punto', icono: 'geom_point' },
    linea: { titulo: 'Distancia', icono: 'linea' },
    poligono: { titulo: 'Área', icono: 'poligono' },
};

const metros = (valor) => (Number.isFinite(valor) ? `${formatNumber(Math.round(valor))} m` : 'Sin dato');

const Fila = ({ etiqueta, valor, nueva }) => (
    <div className="flex items-baseline justify-between gap-3 font-garet text-[13px]/[18px] text-graphite">
        <span>{etiqueta}</span>
        <strong className={`font-bold tabular-nums whitespace-nowrap ${nueva ? 'text-purple-deep' : 'text-graphite'}`}>{valor}</strong>
    </div>
);

const Filas = ({ resultado }) => {
    if (resultado.modo === 'punto') return <Fila etiqueta="Altura sobre el nivel del mar" valor={metros(resultado.alt)} nueva />;
    if (resultado.modo === 'linea') {
        return (
            <>
                <Fila etiqueta="En línea recta" valor={formatLengthValue(resultado.plano)} />
                <Fila etiqueta="Siguiendo el terreno" valor={formatLengthValue(resultado.superficie)} nueva />
                <Fila etiqueta="Subida acumulada" valor={`+${metros(resultado.sube)}`} nueva />
                <Fila etiqueta="Bajada acumulada" valor={`−${metros(resultado.baja)}`} nueva />
                <Fila etiqueta="Máx. / mín." valor={`${metros(resultado.max)} / ${metros(resultado.min)}`} nueva />
            </>
        );
    }
    return (
        <>
            <Fila etiqueta="Vista desde arriba" valor={formatAreaValue(resultado.plano)} />
            <Fila etiqueta="Sobre el relieve" valor={formatAreaValue(resultado.superficie)} nueva />
            <Fila etiqueta="Perímetro" valor={formatLengthValue(resultado.perimetro)} />
            {resultado.distribucion && (
                <Fila etiqueta="Máx. / mín." valor={`${metros(resultado.max)} / ${metros(resultado.min)}`} nueva />
            )}
        </>
    );
};

const graficaDe = (resultado, onRecorrer) => {
    if (resultado.modo === 'linea' && resultado.perfil.length > 1) {
        return {
            titulo: 'Perfil de elevación',
            props: {
                puntos: resultado.perfil.map(p => ({ x: p.metros, alt: p.alt, lngLat: p.lngLat })),
                formatoX: formatLengthValue,
                texto: (p) => `${formatLengthValue(p.x)} · ${metros(p.alt)}`,
                etiqueta: 'Perfil de elevación de la línea medida',
                onRecorrer,
            },
        };
    }
    if (resultado.modo === 'poligono' && resultado.distribucion) {
        return {
            titulo: 'Alturas dentro del área',
            props: {
                puntos: resultado.distribucion.curva,
                formatoX: (x) => `${Math.round(x)} %`,
                texto: (p) => `${Math.round(p.x)} % del área sobre ${metros(p.alt)}`,
                etiqueta: 'Porcentaje del área por encima de cada altura',
            },
        };
    }
    return null;
};

const PanelMedicion = ({ modo, resultado, onCerrar, onRecorrer, ancho = 'w-[300px]', className = '' }) => {
    const panelRef = useRef(null);
    const { isDragging, handleProps } = useDraggablePanel({ panelRef });
    const encabezado = ENCABEZADOS[resultado?.modo || modo];
    if (!encabezado || !resultado) return null;
    const grafica = graficaDe(resultado, onRecorrer);

    return (
        <section
            ref={panelRef}
            className={`flex ${ancho} max-md:max-w-[calc(100vw-5rem)] flex-col gap-2 rounded-[12px] bg-[#F9FBFF] px-4.5 pb-3 pt-2 shadow-[0_5px_20px_#1A26641A] ${className}`}
            aria-label={encabezado.titulo}
        >
            <div {...handleProps} className={`touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}>
                <PanelHeader
                    icono={<Icon name={encabezado.icono} className="size-5 shrink-0" />}
                    titulo={encabezado.titulo}
                    acciones={onCerrar && <MobileSheetCloseButton onClick={onCerrar} />}
                />
            </div>
            <div className="flex flex-col gap-1.5 rounded-[7px] bg-white p-3">
                <Filas resultado={resultado} />
                {grafica && (
                    <div className="mt-2">
                        <span className="font-garet font-bold text-[12px] text-graphite">{grafica.titulo}</span>
                        <GraficaAlturas {...grafica.props} />
                    </div>
                )}
            </div>
        </section>
    );
};

export default PanelMedicion;

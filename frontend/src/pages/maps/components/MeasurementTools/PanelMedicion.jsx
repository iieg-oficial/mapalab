import { useRef } from 'react';
import Icon from '@components/Icon';
import PanelHeader from '@components/PanelHeader';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { formatAreaValue, formatLengthValue } from '@pages/maps/helpers/formatMeasure';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { useDraggablePanel } from '../InfoBox/hooks/useDraggablePanel';
import GraficaAlturas from './GraficaAlturas';

const ENCABEZADOS = {
    punto: { titulo: 'Pin', icono: 'pin' },
    linea: { titulo: 'Distancia', icono: 'linea' },
    poligono: { titulo: 'Área', icono: 'poligono' },
};

const metros = (valor) => (Number.isFinite(valor) ? `${formatNumber(Math.round(valor))} m` : 'Sin dato');

const Fila = ({ etiqueta, valor, nueva }) => (
    <div className="flex items-baseline justify-between gap-2 font-garet text-graphite">
        <span className="whitespace-nowrap">{etiqueta}</span>
        <strong className={`font-bold tabular-nums whitespace-nowrap ${nueva ? 'text-purple-deep' : 'text-graphite'}`}>{valor}</strong>
    </div>
);

const Filas = ({ resultado, unidades = {} }) => {
    const largo = (valor) => formatLengthValue(valor, unidades.lengthUnit || 'auto');
    const area = (valor) => formatAreaValue(valor, unidades.areaUnit || 'auto');
    if (resultado.modo === 'punto') {
        const [lng, lat] = resultado.lngLat || [];
        return (
            <>
                {Number.isFinite(lat) && <Fila etiqueta="Latitud, longitud" valor={`${lat.toFixed(5)}, ${lng.toFixed(5)}`} />}
                <Fila etiqueta="Altura sobre el nivel del mar" valor={metros(resultado.alt)} nueva />
            </>
        );
    }
    if (resultado.modo === 'linea') {
        return (
            <>
                <Fila etiqueta="En línea recta" valor={largo(resultado.plano)} />
                <Fila etiqueta="Por el terreno" valor={largo(resultado.superficie)} nueva />
                <Fila etiqueta="Subida" valor={`+${metros(resultado.sube)}`} nueva />
                <Fila etiqueta="Bajada" valor={`−${metros(resultado.baja)}`} nueva />
                <Fila etiqueta="Máx. / mín." valor={`${metros(resultado.max)} / ${metros(resultado.min)}`} nueva />
            </>
        );
    }
    return (
        <>
            <Fila etiqueta="Desde arriba" valor={area(resultado.plano)} />
            <Fila etiqueta="Sobre el relieve" valor={area(resultado.superficie)} nueva />
            <Fila etiqueta="Perímetro" valor={largo(resultado.perimetro)} />
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

const PanelMedicion = ({ modo, resultado, unidades, onCerrar, onRecorrer, ancho = 'w-[300px]', arrastrable = true, className = '' }) => {
    const panelRef = useRef(null);
    const { isDragging, handleProps } = useDraggablePanel({ panelRef });
    const encabezado = ENCABEZADOS[resultado?.modo || modo];
    if (!encabezado || !resultado) return null;
    const grafica = graficaDe(resultado, onRecorrer);

    return (
        <section
            ref={panelRef}
            className={`flex ${ancho} max-md:max-w-[calc(100vw-5rem)] flex-col gap-2 overflow-hidden rounded-[12px] bg-[#F9FBFF] pb-3 pt-2 shadow-[0_5px_20px_#1A26641A] ${arrastrable ? 'px-4.5 text-[13px]/[18px]' : 'px-3 text-[12px]/[17px]'} ${className}`}
            aria-label={encabezado.titulo}
        >
            <div {...(arrastrable ? handleProps : {})} className={arrastrable ? `touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}` : ''}>
                <PanelHeader
                    icono={<Icon name={encabezado.icono} className="size-5 shrink-0" />}
                    titulo={encabezado.titulo}
                    acciones={onCerrar && <MobileSheetCloseButton onClick={onCerrar} />}
                />
            </div>
            <div className={`flex flex-col gap-1.5 rounded-[7px] bg-white ${arrastrable ? 'p-3' : 'p-2.5'}`}>
                <Filas resultado={resultado} unidades={unidades} />
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

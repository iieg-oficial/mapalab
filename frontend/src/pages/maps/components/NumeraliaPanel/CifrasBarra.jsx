import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Tooltip from '@components/Tooltip';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { useMapsContext } from '@hooks/useMaps';
import { useNumeraliaPanel } from '@contexts/NumeraliaPanelContext';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { SLOT_COLORS } from '@pages/maps/helpers/swipeTheme';
import { compacto, sumarLado } from '@pages/maps/helpers/repartoBarra';
import { cifrasBarraStore } from '@pages/maps/helpers/cifrasBarraStore';
import { MOVIMIENTO, UBICACION_PILDORA as UBICACION } from '@pages/maps/helpers/posicionNodo';
import DatePill from '../ActiveLayers/DatePill';
import { computeLabel } from '../ActiveLayers/datePillHelpers';

const TONO = { A: SLOT_COLORS.A.fg, B: '#B85C00' };
const ORDEN = {
    vertical: { A: 'flex-col-reverse items-end', B: 'flex-col-reverse items-start' },
    horizontal: { A: 'flex-col-reverse items-center', B: 'flex-col items-center' },
};

const DETALLE = {
    vertical: { A: 'right-full mr-2 top-1/2 -translate-y-1/2', B: 'left-full ml-2 top-1/2 -translate-y-1/2' },
    horizontal: { A: 'left-full ml-2 top-1/2 -translate-y-1/2', B: 'left-full ml-2 top-1/2 -translate-y-1/2' },
};

const entero = (valor) => (valor === null ? '—' : formatNumber(String(Math.round(valor * 100) / 100)));
const plural = (n, palabra) => `${n} ${palabra}${n === 1 ? '' : 's'}`;

const explicacion = (lado, suma) => {
    const completos = suma.municipios - suma.cortados;
    const base = `${completos}: ${plural(completos, 'municipio')} que ${completos === 1 ? 'queda completo' : 'quedan completos'} del lado ${lado}.`;
    if (!suma.cortados) return base;
    const uno = suma.cortados === 1;
    return `${base} +${suma.cortados}: ${plural(suma.cortados, 'municipio')} que la barra parte en dos; ${uno ? 'se suma' : 'se suman'} a este lado porque aquí queda la mayor parte de su territorio. En el mapa ${uno ? 'va rayado' : 'van rayados'}.`;
};

const AYUDA = 'Cada lado suma los municipios que quedan de su lado de la barra, con la fecha de ese lado. Un municipio cortado por la barra cuenta completo del lado donde queda su mayor parte y se dibuja rayado. Solo se reparten los indicadores que se pueden sumar.';

const Ayuda = () => (
    <Tooltip content={AYUDA} placement="top" delay={200}>
        <button
            type="button"
            aria-label={AYUDA}
            className="size-5 rounded-full border border-[#FFE4C4] hover:border-[#FFD9AD] bg-[#FFE4C4] hover:bg-[#FFD9AD] text-orange flex items-center justify-center transition-colors cursor-help"
        >
            <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 6.5h.01" />
                <path d="M12 10.5v7" />
            </svg>
        </button>
    </Tooltip>
);

const Detalle = ({ titulo, ambito, slots, suma, completo, onCerrar, movil = false }) => {
    const indices = slots.map((_, i) => i).filter(i => suma.valores[i] !== null);
    const visibles = completo ? indices : indices.slice(0, 1);
    return (
        <div className={`${movil ? 'w-full px-3 py-2.5 bg-[#EFF3FC]' : 'w-max max-w-[240px] px-3 py-2 bg-[#F9FBFF] shadow-[0_5px_20px_#1A266433]'} rounded-[10px] font-garet text-left`}>
            <div className="flex items-center justify-between gap-3">
                <span className="flex flex-col min-w-0">
                    <span className="text-[11px]/[14px] font-bold text-[#2E4372] truncate">{titulo}</span>
                    {ambito && <span className="self-start mt-0.5 px-2 py-0.5 rounded-full bg-[#F0EAF3] text-purple text-[10px]/[12px] font-bold whitespace-nowrap">{ambito}</span>}
                </span>
                <span className="flex items-center gap-1.5">
                    <Ayuda />
                    {completo && <MobileSheetCloseButton onClick={onCerrar} />}
                </span>
            </div>
            <dl className="mt-1 grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 tabular-nums">
                {visibles.map(i => (
                    <div key={slots[i].nombre} className="contents">
                        <dt className="text-[11px]/[15px] text-[#465055]">{slots[i].nombre}</dt>
                        <dd className="text-[12px]/[15px] font-bold text-right text-[#191919]">{entero(suma.valores[i])}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
};

const Municipios = ({ lado, suma }) => (
    <span className="flex items-center group-data-[arrastrando=true]/barra:hidden">
        <Tooltip content={explicacion(lado, suma)} placement="top" delay={200} triggerClassName="items-center">
            <span className="h-5 px-1.5 inline-flex items-center gap-0.5 rounded-full text-[10px] leading-none font-bold" style={{ color: TONO[lado], backgroundColor: SLOT_COLORS[lado].bg }}>
                {suma.municipios - suma.cortados}
                {suma.cortados > 0 && <span className="font-semibold opacity-75">{`+${suma.cortados}`}</span>}
            </span>
        </Tooltip>
    </span>
);

const Pastilla = ({ lado, titulo, ambito, ranking, suma, fecha, orientacion, fijada, onFijar, onFecha, onResaltar, movil }) => {
    const principal = suma.valores.findIndex(v => v !== null);
    if (principal < 0) return null;
    return (
        <div
            className={`group/cifra absolute flex gap-1.5 pointer-events-auto group-data-[arrastrando=true]/barra:pointer-events-none ${ORDEN[orientacion][lado]} ${MOVIMIENTO} ${UBICACION[orientacion][lado]}`}
            onPointerDown={e => e.stopPropagation()}
            onMouseEnter={() => onResaltar(lado)}
            onMouseLeave={() => onResaltar(null)}
        >
            {fecha?.label && (
                <span className="group-data-[arrastrando=true]/barra:hidden">
                    <DatePill slot={lado} label={fecha.label} kind={fecha.kind} onClick={onFecha} size="md" autoWidth />
                </span>
            )}
            <button
                type="button"
                onClick={onFijar}
                aria-expanded={fijada}
                aria-label={`Lado ${lado}: ${entero(suma.valores[principal])} ${ranking.slots[principal].nombre}. Ver el detalle`}
                className="flex items-center gap-2 h-8 px-3.5 rounded-full bg-[#F9FBFF]/95 font-garet tabular-nums whitespace-nowrap cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-orange"
                style={{ boxShadow: `inset 0 0 0 1.5px ${TONO[lado]}33, 0 3px 10px #1A266433` }}
            >
                <span className="text-[13px] leading-none font-extrabold text-[#191919]">{movil ? compacto(suma.valores[principal]) : entero(suma.valores[principal])}</span>
                <Municipios lado={lado} suma={suma} />
            </button>
            {!movil && (
                <div className={`absolute ${DETALLE[orientacion][lado]} ${fijada ? 'block' : 'hidden group-hover/cifra:block'} group-data-[arrastrando=true]/barra:hidden`}>
                    <Detalle titulo={titulo} ambito={ambito} slots={ranking.slots} suma={suma} completo={fijada} onCerrar={onFijar} />
                </div>
            )}
        </div>
    );
};

const CifrasBarra = ({ layerId, titulo, ambito, rankingA, rankingB, reparto, permitidos, cargando, movil = false }) => {
    const { compareMode, highlightSlots } = useMapsContext();
    const [destino, setDestino] = useState(null);
    const [fijada, setFijada] = useState(null);
    const [ranura, setRanura] = useState(null);
    const { minimizado, alternarMinimizado } = useNumeraliaPanel();

    useEffect(() => {
        setRanura(movil && fijada && !minimizado ? document.querySelector('[data-numeralia-ranura]') : null);
    }, [movil, fijada, minimizado]);

    useEffect(() => {
        setDestino(document.querySelector('[data-swipe-nodo]'));
    }, [reparto]);

    useEffect(() => {
        if (!fijada) return undefined;
        const alEscape = (e) => { if (e.key === 'Escape') setFijada(null); };
        window.addEventListener('keydown', alEscape);
        return () => window.removeEventListener('keydown', alEscape);
    }, [fijada]);

    const sumaA = sumarLado(rankingA, reparto, 'A', permitidos);
    const sumaB = sumarLado(rankingB, reparto, 'B', permitidos);
    const visibles = Boolean(destino && sumaA && sumaB);

    useEffect(() => {
        cifrasBarraStore.fijar({ activas: visibles });
        return () => cifrasBarraStore.fijar({ activas: false });
    }, [visibles]);

    const esperando = Boolean(destino && !visibles && (cargando || !reparto));

    useEffect(() => {
        cifrasBarraStore.fijar({ cargando: esperando });
        return () => cifrasBarraStore.fijar({ cargando: false });
    }, [esperando]);

    if (!visibles) return null;
    const orientacion = compareMode?.swipeOrientation === 'horizontal' ? 'horizontal' : 'vertical';

    const fechaDe = (lado) => computeLabel(compareMode?.[`pane${lado}`]?.filters?.[layerId]?.date, null);
    const comun = (lado) => ({
        lado,
        titulo,
        ambito,
        orientacion,
        movil,
        fecha: fechaDe(lado),
        fijada: fijada === lado,
        onFijar: () => {
            if (movil && minimizado && fijada !== lado) alternarMinimizado?.();
            setFijada(actual => (actual === lado ? null : lado));
        },
        onFecha: () => cifrasBarraStore.fijar({ solicitud: lado }),
        onResaltar: (slot) => highlightSlots?.(slot),
    });

    const sumaFijada = fijada === 'A' ? sumaA : sumaB;
    const rankingFijado = fijada === 'A' ? rankingA : rankingB;

    return (
        <>
            {createPortal(
                <>
                    <Pastilla ranking={rankingA} suma={sumaA} {...comun('A')} />
                    <Pastilla ranking={rankingB} suma={sumaB} {...comun('B')} />
                </>,
                destino,
            )}
            {movil && fijada && ranura && createPortal(
                <Detalle movil titulo={titulo} ambito={ambito} slots={rankingFijado.slots} suma={sumaFijada} completo onCerrar={() => setFijada(null)} />,
                ranura,
            )}
        </>
    );
};

export default CifrasBarra;

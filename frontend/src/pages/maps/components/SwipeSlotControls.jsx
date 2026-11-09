import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react';
import { createPortal } from 'react-dom';
import { useMapsContext } from '@hooks/useMaps';
import { useSider } from '@contexts/SiderContext';
import { useOutsideClick } from '@hooks/useOutsideClick';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import ConfirmDropdown from '@components/ConfirmDropdown';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import DatePill from './ActiveLayers/DatePill';
import { computeLabel } from './ActiveLayers/datePillHelpers';
import { useCifrasBarra } from '@pages/maps/hooks/useCifrasBarra';
import { cifrasBarraStore, posicionBarraStore } from '@pages/maps/helpers/cifrasBarraStore';
import {
    MOVIMIENTO, UBICACION_BOTONES, UBICACION_PILDORA, ubicacionAncla, ubicacionPanel,
} from '@pages/maps/helpers/posicionNodo';
import PanelPeriodicidad from './SwipeBar/PanelPeriodicidad';
import PanelCapas from './SwipeBar/PanelCapas';

const OCULTO_AL_ARRASTRAR = 'group-data-[arrastrando=true]/barra:hidden';
const X_CON_HOVER = [
    'md:opacity-0 md:pointer-events-none',
    'md:group-data-[nodo=true]/barra:opacity-100 md:group-data-[nodo=true]/barra:pointer-events-auto',
    'md:group-hover/acciones:opacity-100 md:group-hover/acciones:pointer-events-auto',
    'md:group-focus-within/acciones:opacity-100 md:group-focus-within/acciones:pointer-events-auto',
].join(' ');

const ListaIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M9 6.5h11M9 12h11M9 17.5h11" />
        <circle cx="4.5" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
        <circle cx="4.5" cy="17.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
);

const TONOS_BOTON = {
    barra: 'bg-[#FF8300] hover:bg-[#E67600]',
    peligro: 'bg-[#FF577D] hover:bg-[#E84D6F]',
};

const BotonNodo = ({ etiqueta, activo = false, tono = 'barra', onClick, children, ...resto }) => (
    <Tooltip content={etiqueta} placement="right" delay={300}>
        <button
            type="button"
            onClick={onClick}
            aria-label={etiqueta}
            className={`size-9 md:size-8 flex items-center justify-center rounded-full text-white shadow-[0_3px_10px_#1A266433] transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#FF8300] ${TONOS_BOTON[tono]} ${activo ? 'ring-2 ring-white' : ''}`}
            {...resto}
        >
            {children}
        </button>
    </Tooltip>
);

const SwipeSlotControls = () => {
    const {
        compareMode, exitCompareMode, toggleSwipeOrientation,
        selectedLayerForSymbology, setSelectedLayerForSymbology, allLayers, getLoopState, highlightSlots,
    } = useMapsContext();
    const [abierto, setAbierto] = useState(null);
    const [confirmando, setConfirmando] = useState(false);
    const [destino, setDestino] = useState(null);
    const contenedorRef = useRef(null);
    const hojaRef = useRef(null);
    const objetivoRef = useRef(null);
    const { isMobile } = useSider();
    const posicionViva = useSyncExternalStore(posicionBarraStore.subscribe, posicionBarraStore.get);

    useOutsideClick([contenedorRef, hojaRef], () => setAbierto(null));

    useEffect(() => {
        setDestino(compareMode?.active ? document.querySelector('[data-swipe-nodo]') : null);
    }, [compareMode?.active]);

    const layerId = selectedLayerForSymbology?.id || null;
    const layerDef = useMemo(() => (layerId ? findLayerDef(layerId, allLayers) : null), [layerId, allLayers]);
    const rasterPeriodicity = layerDef?.rasterPeriodicity || null;

    useEffect(() => {
        if (objetivoRef.current) {
            setAbierto(objetivoRef.current);
            objetivoRef.current = null;
            return;
        }
        setAbierto(null);
    }, [layerId]);

    const { activas: cifrasActivas, solicitud } = useCifrasBarra();

    useEffect(() => {
        if (!solicitud) return;
        setAbierto(solicitud);
        cifrasBarraStore.fijar({ solicitud: null });
    }, [solicitud]);

    const inA = !!(layerId && compareMode?.paneA?.activeLayerIds?.includes(layerId));
    const inB = !!(layerId && compareMode?.paneB?.activeLayerIds?.includes(layerId));
    const labelA = useMemo(
        () => computeLabel(compareMode?.paneA?.filters?.[layerId]?.date, rasterPeriodicity),
        [compareMode?.paneA?.filters, layerId, rasterPeriodicity],
    );
    const labelB = useMemo(
        () => computeLabel(compareMode?.paneB?.filters?.[layerId]?.date, rasterPeriodicity),
        [compareMode?.paneB?.filters, layerId, rasterPeriodicity],
    );

    if (!compareMode?.active || !destino) return null;
    const orientacion = compareMode.swipeOrientation === 'horizontal' ? 'horizontal' : 'vertical';
    const isHorizontal = orientacion === 'horizontal';
    const posicion = posicionViva ?? compareMode.swipePosition ?? 0.5;
    const panel = isMobile ? 'relative' : `absolute ${ubicacionPanel(orientacion, posicion)} pointer-events-auto`;

    const alternar = (objetivo) => setAbierto(previo => (previo === objetivo ? null : objetivo));
    const cerrar = () => setAbierto(null);

    const elegirFecha = (capa, slot) => {
        if (capa.id === layerId) {
            setAbierto(slot);
            return;
        }
        objetivoRef.current = slot;
        setSelectedLayerForSymbology?.({ id: capa.id, name: capa.name });
    };

    const pildoraFecha = (slot, dentro, etiqueta) => (dentro && etiqueta.label && !cifrasActivas ? (
        <span
            className={`absolute pointer-events-auto ${OCULTO_AL_ARRASTRAR} ${MOVIMIENTO} ${UBICACION_PILDORA[orientacion][slot]}`}
            onMouseEnter={() => highlightSlots?.(slot)}
            onMouseLeave={() => highlightSlots?.(null)}
        >
            <DatePill
                slot={slot}
                label={etiqueta.label}
                kind={etiqueta.kind}
                onClick={() => alternar(slot)}
                isLooping={!!(layerId && getLoopState?.(layerId, slot)?.isPlaying)}
                size="md"
                autoWidth
            />
        </span>
    ) : null);

    const paneles = (
        <>
            {abierto === 'A' && <PanelPeriodicidad layerId={layerId} slot="A" onClose={cerrar} ubicacion={panel} />}
            {abierto === 'B' && <PanelPeriodicidad layerId={layerId} slot="B" onClose={cerrar} ubicacion={panel} />}
            {abierto === 'capas' && <PanelCapas onClose={cerrar} onElegirFecha={elegirFecha} ubicacion={panel} />}
        </>
    );

    const orientacionTexto = isHorizontal ? 'Cambiar a barra vertical' : 'Cambiar a barra horizontal';

    return createPortal(
        <div ref={contenedorRef} className="contents">
            {pildoraFecha('A', inA, labelA)}
            {pildoraFecha('B', inB, labelB)}

            <div className={`group/acciones absolute flex gap-3 md:gap-2.5 pointer-events-auto ${OCULTO_AL_ARRASTRAR} ${UBICACION_BOTONES[orientacion]}`}>
                <BotonNodo
                    etiqueta={abierto === 'capas' ? 'Cerrar las capas comparadas' : 'Ver las capas comparadas'}
                    activo={abierto === 'capas'}
                    onClick={() => alternar('capas')}
                    aria-expanded={abierto === 'capas'}
                >
                    <ListaIcon className="size-5" />
                </BotonNodo>
                <BotonNodo etiqueta={orientacionTexto} onClick={toggleSwipeOrientation}>
                    <Icon name="swipe_orientacion" className={`size-5 transition-transform ${isHorizontal ? '' : 'rotate-90'}`} />
                </BotonNodo>
                <span className={`transition-opacity duration-150 motion-reduce:transition-none ${confirmando ? '' : X_CON_HOVER}`}>
                    <BotonNodo etiqueta="Cerrar comparador" tono="peligro" activo={confirmando} onClick={() => setConfirmando(true)}>
                        <Icon name="close" className="size-4" />
                    </BotonNodo>
                </span>
            </div>

            <div className={`absolute pointer-events-auto ${ubicacionAncla(orientacion, posicion)}`}>
                <ConfirmDropdown
                    open={confirmando}
                    onClose={() => setConfirmando(false)}
                    onConfirm={exitCompareMode}
                    title="¿Cerrar la comparación?"
                    description="Se descartará la comparación actual y volverás al estado original del mapa."
                    confirmText="Sí, cerrar comparador"
                    placement={isHorizontal && posicion > 0.5 ? 'top' : 'bottom'}
                    className={!isHorizontal && posicion > 0.5 ? 'right-0' : 'left-0'}
                />
            </div>

            {!isMobile && paneles}
            {isMobile && abierto && createPortal(
                <div ref={hojaRef} className="fixed z-40 left-4 right-4 bottom-[calc(env(safe-area-inset-bottom,0px)+16px)] flex justify-center">
                    {paneles}
                </div>,
                document.body,
            )}
        </div>,
        destino,
    );
};

export default SwipeSlotControls;

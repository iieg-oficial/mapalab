import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Tooltip from '@components/Tooltip';
import { useSider } from '@contexts/SiderContext';
import { useFeatureSeen } from '@hooks/useFeatureSeen';
import SymbolGlyph from '@mapsComponents/SymbolGlyph';
import EventoBotonGlyph from '@mapsComponents/EventoBotonGlyph';
import EventoFunAguila from '@mapsComponents/EventoFunAguila';
import EventoFunPin from '@mapsComponents/EventoFunPin';
import { useFunFactDestino } from '@hooksMaps/useFunFactDestino';
import { FactPopover, MobileFactBanner, POPOVER_DATA_ATTR, POPOVER_MAX_WIDTH } from '@mapsComponents/EventoFunPopover';
import { peekNextFact, pickNextFact } from '@pages/maps/helpers/funFactPicker';
import { animacionDeDato } from '@pages/maps/helpers/eventoDiversion';
import { trackEventoFunFact, trackEventoFunVolver } from '@services/analyticsService';

const MESSAGE_TTL_MS = 10000;
const MAX_ACTIVE_VUELOS = 10;
const BALL_SIZE_PX = 28;
const BOTTOM_PADDING_PX = 4;
const PARVADA = 4;
const RETRASO_ENTRE_AGUILAS_MS = 170;
const ANIMACIONES = {
    pelota: { duracion: 5200, retrasoMensaje: 3700 },
    aguilas: { duracion: 3400 + (PARVADA - 1) * RETRASO_ENTRE_AGUILAS_MS, retrasoMensaje: 1900 },
};
const VIAJE_MS = 2800;
const AGUILA_PX = { ancho: 46, alto: 26 };
const DEFAULT_SIZE_CLASS = 'w-7 h-7 md:w-6 md:h-6';
const DEFAULT_ICON_SIZE = 16;

const movimientoReducido = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const nuevoId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

const anclarPopover = ({ x, top, bottom, placement }, text) => {
    const left = Math.max(16, Math.min(x - POPOVER_MAX_WIDTH / 2, window.innerWidth - POPOVER_MAX_WIDTH - 16));
    return { id: nuevoId(), text, placement, anchorTop: top, anchorBottom: bottom, left, arrowLeft: x - left };
};

const vuelosDePelota = (rect, symbol) => {
    const dx = (Math.random() - 0.5) * 240;
    const ty = Math.max(80, window.innerHeight - rect.top - BALL_SIZE_PX - BOTTOM_PADDING_PX);
    return {
        vuelos: [{ id: nuevoId(), tipo: 'pelota', top: rect.top, left: rect.left, dx, ty, symbol }],
        ancla: { x: rect.left + dx + BALL_SIZE_PX / 2, top: rect.top + ty, bottom: rect.top + ty + BALL_SIZE_PX, placement: 'top' },
    };
};

const vuelosDeAguilas = (rect, symbol) => {
    const dx = window.innerWidth - rect.left + 80;
    const dy = -Math.min(120, Math.max(0, rect.top - 24));
    const vuelos = Array.from({ length: PARVADA }, (_, i) => ({
        id: nuevoId(),
        tipo: 'aguilas',
        top: rect.top - 6,
        left: rect.left - 12,
        dx,
        dy: dy - i * 14,
        retraso: i * RETRASO_ENTRE_AGUILAS_MS,
        symbol: i === 0 ? symbol : null,
    }));
    const y = Math.max(24, rect.top + dy * 0.5 + 20);
    return { vuelos, ancla: { x: rect.left + dx * 0.5, top: y, bottom: y, placement: 'bottom' } };
};

const vuelosAlDestino = (rect, pantalla, symbol) => Array.from({ length: PARVADA }, (_, i) => {
    const retraso = i * RETRASO_ENTRE_AGUILAS_MS;
    const top = rect.top - 6;
    const left = rect.left - 12;
    return {
        id: nuevoId(),
        tipo: 'aterrizaje',
        top,
        left,
        dx: pantalla.x - left - AGUILA_PX.ancho / 2 + (i === 0 ? 0 : (i - 2) * 30),
        dy: pantalla.y - top - AGUILA_PX.alto / 2 - 40 - (i === 0 ? 0 : 16),
        retraso,
        duracion: VIAJE_MS - retraso,
        symbol: i === 0 ? symbol : null,
    };
});

const EventoFunButton = ({ evento, sizeClass = DEFAULT_SIZE_CLASS, iconSize = DEFAULT_ICON_SIZE, avisoPlacement = 'bottom' }) => {
    const buttonRef = useRef(null);
    const popoverTimerRef = useRef(null);
    const dismissTimerRef = useRef(null);
    const [vuelos, setVuelos] = useState([]);
    const [popover, setPopover] = useState(null);
    const [avisoCerrado, setAvisoCerrado] = useState(false);
    const { isMobile } = useSider();
    const { pin, viajar: viajarAlDestino, volver: volverDelDestino, cerrar: cerrarPin } = useFunFactDestino();

    const facts = Array.isArray(evento?.facts) ? evento.facts : [];
    const eventoSymbol = evento?.funIcon || null;
    const aviso = evento?.avisoInicial?.trim() || '';
    const [avisoVisto, marcarAvisoVisto] = useFeatureSeen(aviso ? `evento-aviso:${evento?.slug || evento?.id}` : null);
    const mostrarAviso = Boolean(aviso) && !avisoVisto && !avisoCerrado;

    useEffect(() => {
        setPopover(null);
        if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    }, [evento?.id]);

    useEffect(() => () => {
        if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
    }, []);

    useEffect(() => {
        if (!popover) return undefined;
        const handler = (e) => {
            if (e.target.closest(`[${POPOVER_DATA_ATTR}]`)) return;
            if (buttonRef.current?.contains(e.target)) return;
            setPopover(null);
            if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [popover]);

    if (facts.length === 0) return null;

    const factsKey = evento?.id ?? 'global';
    const simboloBoton = eventoSymbol || peekNextFact(factsKey, facts)?.symbol || null;
    const conFondo = (evento?.botonEstilo?.fondo?.forma ?? 'solido') !== 'ninguno';

    const cerrarAviso = () => {
        if (!mostrarAviso) return;
        setAvisoCerrado(true);
        marcarAvisoVisto();
    };

    const mostrarPopover = (data, retraso) => {
        popoverTimerRef.current = setTimeout(() => {
            setPopover(data);
            dismissTimerRef.current = setTimeout(() => setPopover(null), MESSAGE_TTL_MS);
        }, retraso);
    };

    const lanzarVuelos = (nuevos, vida) => {
        const ids = new Set(nuevos.map((v) => v.id));
        setVuelos((prev) => {
            const next = [...prev, ...nuevos];
            return next.length > MAX_ACTIVE_VUELOS ? next.slice(-MAX_ACTIVE_VUELOS) : next;
        });
        setTimeout(() => {
            setVuelos((prev) => prev.filter((v) => !ids.has(v.id)));
        }, vida);
    };

    const regresarDelDestino = () => {
        if (pin?.eventoId) trackEventoFunVolver(pin.eventoId);
        volverDelDestino();
    };

    const handleClick = () => {
        cerrarAviso();
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;

        const fact = pickNextFact(factsKey, facts);
        if (!fact) return;

        if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
        setPopover(null);

        const symbol = fact.symbol || eventoSymbol;
        const tipo = ANIMACIONES[animacionDeDato(fact, evento)] ? animacionDeDato(fact, evento) : 'pelota';
        const sinMovimiento = movimientoReducido();
        const origen = fact.eventoId ?? evento?.id;
        if (origen) trackEventoFunFact(origen, { animacion: tipo, con_destino: tipo === 'aguilas' && Boolean(fact.destino) });
        if (tipo === 'aguilas' && fact.destino) {
            const pantalla = viajarAlDestino(fact.destino, fact.text, sinMovimiento ? 0 : VIAJE_MS, origen);
            if (pantalla) {
                if (!sinMovimiento) lanzarVuelos(vuelosAlDestino(rect, pantalla, symbol), VIAJE_MS + 200);
                return;
            }
        }
        cerrarPin();
        if (sinMovimiento) {
            mostrarPopover(anclarPopover({ x: rect.left + rect.width / 2, top: rect.bottom, bottom: rect.bottom, placement: 'bottom' }, fact.text), 0);
            return;
        }

        const { vuelos: nuevos, ancla } = tipo === 'aguilas' ? vuelosDeAguilas(rect, symbol) : vuelosDePelota(rect, symbol);
        lanzarVuelos(nuevos, ANIMACIONES[tipo].duracion + 100);
        mostrarPopover(anclarPopover(ancla, fact.text), ANIMACIONES[tipo].retrasoMensaje);
    };

    return (
        <>
            <Tooltip
                content={mostrarAviso ? aviso : 'Dato curioso'}
                placement={mostrarAviso ? avisoPlacement : 'bottom'}
                forceVisible={mostrarAviso}
                delay={200}
            >
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={handleClick}
                    onMouseEnter={cerrarAviso}
                    aria-label="Mostrar dato curioso del evento"
                    className={`${sizeClass} rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-transform cursor-pointer ${conFondo ? 'shadow-[0_5px_20px_#1A26641A]' : ''}`}
                >
                    <EventoBotonGlyph botonEstilo={evento?.botonEstilo} symbol={simboloBoton} iconSize={iconSize} />
                </button>
            </Tooltip>
            {pin && <EventoFunPin pin={pin} onVolver={regresarDelDestino} onCerrar={cerrarPin} />}

            {createPortal(
                <>
                    {vuelos.map((v) => (v.tipo !== 'pelota' ? (
                        <span
                            key={v.id}
                            className={`${v.tipo === 'aterrizaje' ? 'evento-fun-eagle-land' : 'evento-fun-eagle'} pointer-events-none fixed z-60 select-none`}
                            style={{ top: `${v.top}px`, left: `${v.left}px`, '--dx': `${v.dx}px`, '--dy': `${v.dy}px`, '--dur': `${v.duracion || 0}ms`, animationDelay: `${v.retraso}ms`, animationFillMode: 'both' }}
                            aria-hidden="true"
                        >
                            <EventoFunAguila carga={v.symbol} />
                        </span>
                    ) : (
                        <span
                            key={v.id}
                            className="evento-fun-ball pointer-events-none fixed z-60 select-none"
                            style={{ top: `${v.top}px`, left: `${v.left}px`, '--dx': `${v.dx}px`, '--ty': `${v.ty}px` }}
                            aria-hidden="true"
                        >
                            <SymbolGlyph symbol={v.symbol} size={BALL_SIZE_PX} />
                        </span>
                    )))}
                    {popover && (isMobile
                        ? <MobileFactBanner popover={popover} />
                        : <FactPopover popover={popover} />
                    )}
                </>,
                document.body,
            )}
        </>
    );
};

export default EventoFunButton;

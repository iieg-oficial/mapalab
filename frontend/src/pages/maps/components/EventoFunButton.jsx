import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Message from '@components/Message';
import Tooltip from '@components/Tooltip';
import { useSider } from '@contexts/SiderContext';
import SymbolGlyph from '@mapsComponents/SymbolGlyph';
import { pickNextFact } from '@pages/maps/helpers/funFactPicker';
import { trackEventoFunFact } from '@services/analyticsService';

const ANIM_DURATION_MS = 5200;
const BALL_STOP_DELAY_MS = 3700;
const MESSAGE_TTL_MS = 10000;
const MAX_ACTIVE_BALLS = 10;
const BALL_SIZE_PX = 28;
const BOTTOM_PADDING_PX = 4;
const POPOVER_MAX_WIDTH = 320;
const POPOVER_GAP_PX = 14;
const POPOVER_DATA_ATTR = 'data-evento-fun-popover';

const FactPopover = ({ popover }) => {
    const popoverRef = useRef(null);
    const [resolvedTop, setResolvedTop] = useState(null);

    useEffect(() => {
        const el = popoverRef.current;
        if (!el) return;
        const height = el.getBoundingClientRect().height;
        if (popover.placement === 'top') {
            setResolvedTop(popover.anchorTop - POPOVER_GAP_PX - height);
        } else {
            setResolvedTop(popover.anchorBottom + POPOVER_GAP_PX);
        }
    }, [popover.placement, popover.anchorTop, popover.anchorBottom, popover.text]);

    const isTop = popover.placement === 'top';

    return (
        <div
            ref={popoverRef}
            className="fixed z-60 pointer-events-auto"
            style={{
                top: resolvedTop !== null ? `${resolvedTop}px` : `${popover.anchorBottom + POPOVER_GAP_PX}px`,
                left: `${popover.left}px`,
                maxWidth: `${POPOVER_MAX_WIDTH}px`,
                width: 'calc(100vw - 32px)',
                opacity: resolvedTop !== null ? 1 : 0,
                transition: 'opacity 120ms ease-out',
            }}
            {...{ [POPOVER_DATA_ATTR]: '' }}
        >
            <div
                className="absolute w-0 h-0"
                style={{
                    left: `${popover.arrowLeft}px`,
                    transform: 'translateX(-50%)',
                    ...(isTop
                        ? {
                            bottom: '-8px',
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderTop: '8px solid white',
                            filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.08))',
                        }
                        : {
                            top: '-8px',
                            borderLeft: '8px solid transparent',
                            borderRight: '8px solid transparent',
                            borderBottom: '8px solid white',
                            filter: 'drop-shadow(0 -1px 1px rgba(0,0,0,0.06))',
                        }),
                }}
                aria-hidden="true"
            />
            <Message
                variant="info"
                size="small"
                icon=""
                title={null}
                description={popover.text}
            />
        </div>
    );
};

const MobileFactBanner = ({ popover }) => (
    <div
        className="fixed top-4 left-1/2 -translate-x-1/2 z-60 max-w-120 w-[calc(100%-32px)] pointer-events-auto"
        {...{ [POPOVER_DATA_ATTR]: '' }}
    >
        <Message
            variant="info"
            size="medium"
            icon=""
            title={null}
            description={popover.text}
        />
    </div>
);

const EventoFunButton = ({ evento }) => {
    const buttonRef = useRef(null);
    const popoverTimerRef = useRef(null);
    const dismissTimerRef = useRef(null);
    const [balls, setBalls] = useState([]);
    const [popover, setPopover] = useState(null);
    const { isMobile } = useSider();

    const facts = Array.isArray(evento?.facts) ? evento.facts : [];
    const eventoSymbol = evento?.funIcon || null;

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

    const handleClick = () => {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;

        const fact = pickNextFact(evento?.id ?? 'global', facts);
        if (!fact) return;

        if (popoverTimerRef.current) clearTimeout(popoverTimerRef.current);
        if (dismissTimerRef.current) clearTimeout(dismissTimerRef.current);
        setPopover(null);

        const ballSymbol = fact.symbol || eventoSymbol;
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const dx = (Math.random() - 0.5) * 240;
        const ty = Math.max(80, window.innerHeight - rect.top - BALL_SIZE_PX - BOTTOM_PADDING_PX);

        setBalls((prev) => {
            const next = [...prev, { id, top: rect.top, left: rect.left, dx, ty, symbol: ballSymbol }];
            return next.length > MAX_ACTIVE_BALLS ? next.slice(-MAX_ACTIVE_BALLS) : next;
        });
        setTimeout(() => {
            setBalls((prev) => prev.filter((b) => b.id !== id));
        }, ANIM_DURATION_MS + 100);

        if (evento?.id) trackEventoFunFact(evento.id);

        const ballFinalTop = rect.top + ty;
        const ballFinalLeft = rect.left + dx;
        const ballCenter = ballFinalLeft + BALL_SIZE_PX / 2;
        const popoverLeft = Math.max(16, Math.min(ballCenter - POPOVER_MAX_WIDTH / 2, window.innerWidth - POPOVER_MAX_WIDTH - 16));
        const arrowLeft = ballCenter - popoverLeft;
        const popoverData = {
            id,
            text: fact.text,
            symbol: fact.symbol || null,
            placement: 'top',
            anchorTop: ballFinalTop,
            anchorBottom: ballFinalTop + BALL_SIZE_PX,
            left: popoverLeft,
            arrowLeft,
        };

        popoverTimerRef.current = setTimeout(() => {
            setPopover(popoverData);
            dismissTimerRef.current = setTimeout(() => setPopover(null), MESSAGE_TTL_MS);
        }, BALL_STOP_DELAY_MS);
    };

    return (
        <>
            <Tooltip content="Dato curioso" placement="bottom" delay={300}>
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={handleClick}
                    aria-label="Mostrar dato curioso del evento"
                    className="w-7 h-7 md:w-6 md:h-6 rounded-full bg-white flex items-center justify-center shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)] hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                >
                    <SymbolGlyph symbol={eventoSymbol} size={16} />
                </button>
            </Tooltip>

            {createPortal(
                <>
                    {balls.map((b) => (
                        <span
                            key={b.id}
                            className="evento-fun-ball pointer-events-none fixed z-60 select-none"
                            style={{
                                top: `${b.top}px`,
                                left: `${b.left}px`,
                                '--dx': `${b.dx}px`,
                                '--ty': `${b.ty}px`,
                            }}
                            aria-hidden="true"
                        >
                            <SymbolGlyph symbol={b.symbol} size={28} />
                        </span>
                    ))}
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

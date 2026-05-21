import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Message from '@components/Message';
import Tooltip from '@components/Tooltip';
import SymbolGlyph from '@mapsComponents/SymbolGlyph';
import { pickNextFact } from '@pages/maps/helpers/funFactPicker';
import { trackEventoFunFact } from '@services/analyticsService';

const ANIM_DURATION_MS = 5200;
const MAX_ACTIVE_BALLS = 10;
const BALL_SIZE_PX = 28;
const POPOVER_MAX_WIDTH = 320;
const POPOVER_GAP_PX = 14;
const POPOVER_HEIGHT_HINT = 180;

const FactPopover = ({ popover, onClose }) => {
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
                closable
                onClose={onClose}
            >
                {popover.symbol && (
                    <div className="flex justify-center mb-2">
                        <SymbolGlyph symbol={popover.symbol} size={32} />
                    </div>
                )}
            </Message>
        </div>
    );
};

const EventoFunButton = ({ evento }) => {
    const buttonRef = useRef(null);
    const [balls, setBalls] = useState([]);
    const [popover, setPopover] = useState(null);

    const facts = Array.isArray(evento?.facts) ? evento.facts : [];
    const eventoSymbol = evento?.funIcon || null;

    useEffect(() => {
        setPopover(null);
    }, [evento?.id]);

    if (facts.length === 0) return null;

    const handleClick = () => {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;

        const fact = pickNextFact(evento?.id ?? 'global', facts);
        if (!fact) return;

        const ballSymbol = fact.symbol || eventoSymbol;
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const dx = (Math.random() - 0.5) * 240;
        const ty = Math.max(80, window.innerHeight - rect.top - BALL_SIZE_PX);

        setBalls((prev) => {
            const next = [...prev, { id, top: rect.top, left: rect.left, dx, ty, symbol: ballSymbol }];
            return next.length > MAX_ACTIVE_BALLS ? next.slice(-MAX_ACTIVE_BALLS) : next;
        });
        setTimeout(() => {
            setBalls((prev) => prev.filter((b) => b.id !== id));
        }, ANIM_DURATION_MS + 100);

        if (evento?.id) trackEventoFunFact(evento.id);

        const buttonCenter = rect.left + rect.width / 2;
        const popoverLeft = Math.max(16, Math.min(buttonCenter - POPOVER_MAX_WIDTH / 2, window.innerWidth - POPOVER_MAX_WIDTH - 16));
        const arrowLeft = buttonCenter - popoverLeft;
        const placeAbove = rect.top >= POPOVER_HEIGHT_HINT + POPOVER_GAP_PX + 16;
        setPopover({
            id,
            text: fact.text,
            symbol: fact.symbol || eventoSymbol,
            placement: placeAbove ? 'top' : 'bottom',
            anchorTop: rect.top,
            anchorBottom: rect.top + rect.height,
            left: popoverLeft,
            arrowLeft,
        });
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
                    {popover && (
                        <FactPopover popover={popover} onClose={() => setPopover(null)} />
                    )}
                </>,
                document.body,
            )}
        </>
    );
};

export default EventoFunButton;

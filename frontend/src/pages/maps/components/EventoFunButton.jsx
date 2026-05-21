import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Message from '@components/Message';
import Tooltip from '@components/Tooltip';
import SymbolGlyph from '@mapsComponents/SymbolGlyph';
import { pickNextFact } from '@pages/maps/helpers/funFactPicker';
import { trackEventoFunFact } from '@services/analyticsService';

const ANIM_DURATION_MS = 2400;
const MAX_ACTIVE_BALLS = 30;

const EventoFunButton = ({ evento }) => {
    const buttonRef = useRef(null);
    const [balls, setBalls] = useState([]);
    const [currentFact, setCurrentFact] = useState(null);

    const facts = Array.isArray(evento?.facts) ? evento.facts : [];
    const eventoSymbol = evento?.funIcon || null;

    useEffect(() => {
        setCurrentFact(null);
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
        const ty = window.innerHeight - rect.top + 60;

        setBalls((prev) => {
            const next = [...prev, { id, top: rect.top, left: rect.left, dx, ty, symbol: ballSymbol }];
            return next.length > MAX_ACTIVE_BALLS ? next.slice(-MAX_ACTIVE_BALLS) : next;
        });
        setTimeout(() => {
            setBalls((prev) => prev.filter((b) => b.id !== id));
        }, ANIM_DURATION_MS + 100);

        if (evento?.id) trackEventoFunFact(evento.id);

        setCurrentFact({ id, text: fact.text, symbol: fact.symbol || eventoSymbol });
    };

    return (
        <>
            <Tooltip content="Dato curioso" placement="top" delay={300}>
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
                    {currentFact && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-60 max-w-120 w-[calc(100%-32px)] pointer-events-auto">
                            <Message
                                variant="info"
                                size="medium"
                                icon={null}
                                title={currentFact.symbol ? null : 'Dato curioso del evento'}
                                description={currentFact.text}
                                closable
                                onClose={() => setCurrentFact(null)}
                            >
                                {currentFact.symbol && (
                                    <div className="flex items-start gap-3">
                                        <SymbolGlyph symbol={currentFact.symbol} size={36} className="shrink-0 mt-0.5" />
                                    </div>
                                )}
                            </Message>
                        </div>
                    )}
                </>,
                document.body,
            )}
        </>
    );
};

export default EventoFunButton;

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Message from '@components/Message';
import Tooltip from '@components/Tooltip';
import { pickNextFact } from '@pages/maps/helpers/funFactPicker';
import { trackEventoFunFact } from '@services/analyticsService';

const ANIM_DURATION_MS = 2400;
const MESSAGE_TTL_MS = 5000;
const MAX_ACTIVE_BALLS = 30;

const EVENTO_FUN_DEFAULT_ICON = 'soccer';
const ICON_EMOJI = {
    soccer: '⚽',
    star: '⭐',
    party: '🎉',
    book: '📘',
    bulb: '💡',
};

const resolveEmoji = (icon) => ICON_EMOJI[icon] || ICON_EMOJI[EVENTO_FUN_DEFAULT_ICON];

const EventoFunButton = ({ evento }) => {
    const buttonRef = useRef(null);
    const factTimerRef = useRef(null);
    const [balls, setBalls] = useState([]);
    const [currentFact, setCurrentFact] = useState(null);

    const facts = Array.isArray(evento?.facts) ? evento.facts.filter((s) => typeof s === 'string' && s.trim()) : [];
    const emoji = resolveEmoji(evento?.funIcon);

    useEffect(() => () => {
        if (factTimerRef.current) clearTimeout(factTimerRef.current);
    }, []);

    if (facts.length === 0) return null;

    const handleClick = () => {
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;

        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        const dx = (Math.random() - 0.5) * 240;
        const ty = window.innerHeight - rect.top + 60;
        setBalls((prev) => {
            const next = [...prev, {
                id,
                top: rect.top,
                left: rect.left,
                dx,
                ty,
                emoji,
            }];
            return next.length > MAX_ACTIVE_BALLS ? next.slice(-MAX_ACTIVE_BALLS) : next;
        });
        setTimeout(() => {
            setBalls((prev) => prev.filter((b) => b.id !== id));
        }, ANIM_DURATION_MS + 100);

        if (evento?.id) trackEventoFunFact(evento.id);

        const fact = pickNextFact(evento?.id ?? 'global', facts);
        if (fact) {
            setCurrentFact({ id, text: fact });
            if (factTimerRef.current) clearTimeout(factTimerRef.current);
            factTimerRef.current = setTimeout(() => setCurrentFact(null), MESSAGE_TTL_MS);
        }
    };

    return (
        <>
            <Tooltip content="Dato curioso" placement="top" delay={300}>
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={handleClick}
                    aria-label="Mostrar dato curioso del evento"
                    className="w-7 h-7 md:w-6 md:h-6 rounded-full bg-white flex items-center justify-center text-base shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)] hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                >
                    <span aria-hidden="true">{emoji}</span>
                </button>
            </Tooltip>

            {createPortal(
                <>
                    {balls.map((b) => (
                        <span
                            key={b.id}
                            className="evento-fun-ball pointer-events-none fixed z-[60] text-2xl select-none"
                            style={{
                                top: `${b.top}px`,
                                left: `${b.left}px`,
                                '--dx': `${b.dx}px`,
                                '--ty': `${b.ty}px`,
                            }}
                            aria-hidden="true"
                        >
                            {b.emoji}
                        </span>
                    ))}
                    {currentFact && (
                        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] max-w-[420px] w-[calc(100%-32px)] pointer-events-auto">
                            <Message
                                variant="info"
                                size="small"
                                title={`${emoji} ¿Sabias que...?`}
                                description={currentFact.text}
                                closable
                                onClose={() => setCurrentFact(null)}
                            />
                        </div>
                    )}
                </>,
                document.body,
            )}
        </>
    );
};

export default EventoFunButton;

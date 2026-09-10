import { useEffect, useRef, useState } from 'react';
import Message from '@components/Message';

export const POPOVER_MAX_WIDTH = 320;
export const POPOVER_DATA_ATTR = 'data-evento-fun-popover';
const POPOVER_GAP_PX = 14;

export const FactPopover = ({ popover }) => {
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

export const MobileFactBanner = ({ popover }) => (
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

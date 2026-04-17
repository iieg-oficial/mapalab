import { Children, useRef, useCallback } from 'react';
import { useScrollOverflow } from '@hooks/useScrollOverflow';
import { HIDDEN_SCROLLBAR } from '@constants/global';
import Icon from '@components/Icon';

const ScrollArrow = ({ direction, onClick, arrowIcon, arrowClassName, clickable, hoverRing }) => {
    const icon = (
        <Icon
            name={arrowIcon}
            className={`${arrowClassName} ${direction === 'up' ? 'rotate-180' : ''}`}
        />
    );

    if (!clickable) {
        return (
            <span className="animate-[bounce_4s_ease-in-out_infinite]">
                {icon}
            </span>
        );
    }

    return (
        <button
            type="button"
            onClick={onClick}
            aria-label={direction === 'up' ? 'Ir al inicio' : 'Ir al final'}
            className={`
                p-1 rounded-full border border-transparent transition-colors cursor-pointer
                animate-[bounce_4s_ease-in-out_infinite]
                ${hoverRing ? 'hover:border-[#70308A] hover:bg-white/70' : ''}
            `}
        >
            {icon}
        </button>
    );
};

const ScrollContainer = ({
    children,
    className = '',
    showArrows = true,
    showMask = true,
    overlayFade = false,
    overlayColor = '#F9FBFF',
    stickySize = 0,
    arrowIcon = 'downArrow',
    arrowClassName = 'w-3 h-3',
    hideScrollbar = true,
    as = 'div',
    clickableArrows = false,
    hoverRing = true,
    minItemsForClick = 0,
    itemCount,
    scrollBehavior = 'smooth',
    ...props
}) => {
    const Component = as;
    const containerRef = useRef(null);
    const { canScrollUp, canScrollDown, stickyAtTop, stickyAtBottom } = useScrollOverflow(containerRef);

    const topOffset = stickyAtTop ? stickySize : 0;
    const bottomOffset = stickyAtBottom ? stickySize : 0;

    const effectiveItemCount = itemCount != null ? itemCount : Children.count(children);
    const clickEnabled = clickableArrows && effectiveItemCount >= minItemsForClick;

    const scrollToTop = useCallback(() => {
        containerRef.current?.scrollTo({ top: 0, behavior: scrollBehavior });
    }, [scrollBehavior]);

    const scrollToBottom = useCallback(() => {
        const el = containerRef.current;
        if (!el) return;
        el.scrollTo({ top: el.scrollHeight, behavior: scrollBehavior });
    }, [scrollBehavior]);

    const getMaskClass = () => {
        if (!showMask || overlayFade) return '';
        if (canScrollUp && canScrollDown) {
            return '[mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]';
        }
        if (canScrollUp) {
            return '[mask-image:linear-gradient(to_bottom,transparent_0%,black_10%)]';
        }
        if (canScrollDown) {
            return '[mask-image:linear-gradient(to_bottom,black_90%,transparent_100%)]';
        }
        return '';
    };

    const arrowWrapperPointerClass = clickEnabled ? '' : 'pointer-events-none';

    return (
        <Component
            ref={containerRef}
            className={[
                'relative',
                hideScrollbar ? HIDDEN_SCROLLBAR : 'overflow-y-auto',
                getMaskClass(),
                className
            ].join(' ')}
            {...props}
        >
            {overlayFade && canScrollUp && (
                <div className="sticky left-0 right-0 h-0 pointer-events-none z-[3]" style={{ top: topOffset }}>
                    <div
                        className="h-8"
                        style={{ background: `linear-gradient(to bottom, ${overlayColor}, transparent)` }}
                    />
                </div>
            )}
            {showArrows && canScrollUp && (
                <div className={`sticky left-0 right-0 h-0 ${arrowWrapperPointerClass} z-10`} style={{ top: topOffset + 8 }}>
                    <div className="flex justify-center">
                        <ScrollArrow
                            direction="up"
                            onClick={scrollToTop}
                            arrowIcon={arrowIcon}
                            arrowClassName={arrowClassName}
                            clickable={clickEnabled}
                            hoverRing={hoverRing}
                        />
                    </div>
                </div>
            )}
            {children}
            {showArrows && canScrollDown && (
                <div className={`sticky left-0 right-0 h-0 ${arrowWrapperPointerClass} z-10`} style={{ bottom: bottomOffset + 8 }}>
                    <div className="flex justify-center -translate-y-full">
                        <ScrollArrow
                            direction="down"
                            onClick={scrollToBottom}
                            arrowIcon={arrowIcon}
                            arrowClassName={arrowClassName}
                            clickable={clickEnabled}
                            hoverRing={hoverRing}
                        />
                    </div>
                </div>
            )}
            {overlayFade && canScrollDown && (
                <div className="sticky left-0 right-0 h-0 pointer-events-none z-[3]" style={{ bottom: bottomOffset }}>
                    <div
                        className="h-8 -translate-y-full"
                        style={{ background: `linear-gradient(to top, ${overlayColor}, transparent)` }}
                    />
                </div>
            )}
        </Component>
    );
};

export default ScrollContainer;

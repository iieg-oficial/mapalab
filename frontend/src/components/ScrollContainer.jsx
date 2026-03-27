import { useRef } from 'react';
import { useScrollOverflow } from '@hooks/useScrollOverflow';
import { HIDDEN_SCROLLBAR } from '@constants/global';
import Icon from '@components/Icon';

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
    ...props
}) => {
    const Component = as;
    const containerRef = useRef(null);
    const { canScrollUp, canScrollDown, stickyAtTop, stickyAtBottom } = useScrollOverflow(containerRef);

    const topOffset = stickyAtTop ? stickySize : 0;
    const bottomOffset = stickyAtBottom ? stickySize : 0;

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
            {overlayFade && (
                <div
                    className={`sticky left-0 right-0 h-8 pointer-events-none z-[3] transition-[top,opacity] duration-300 ${canScrollUp ? 'opacity-100' : 'opacity-0'}`}
                    style={{ top: topOffset, background: `linear-gradient(to bottom, ${overlayColor}, transparent)` }}
                />
            )}
            {showArrows && (
                <div
                    className={`sticky left-0 right-0 flex justify-center pointer-events-none z-10 transition-[top,opacity] duration-300 ${canScrollUp ? 'opacity-100' : 'opacity-0'}`}
                    style={{ top: topOffset + 8 }}
                >
                    <Icon name={arrowIcon} className={`${arrowClassName} rotate-180 animate-[bounce_4s_ease-in-out_infinite]`} />
                </div>
            )}
            {children}
            {showArrows && (
                <div
                    className={`sticky left-0 right-0 flex justify-center pointer-events-none z-10 transition-[bottom,opacity] duration-300 ${canScrollDown ? 'opacity-100' : 'opacity-0'}`}
                    style={{ bottom: bottomOffset + 8 }}
                >
                    <Icon name={arrowIcon} className={`${arrowClassName} animate-[bounce_4s_ease-in-out_infinite]`} />
                </div>
            )}
            {overlayFade && (
                <div
                    className={`sticky left-0 right-0 h-8 pointer-events-none z-[3] transition-[bottom,opacity] duration-300 ${canScrollDown ? 'opacity-100' : 'opacity-0'}`}
                    style={{ bottom: bottomOffset, background: `linear-gradient(to top, ${overlayColor}, transparent)` }}
                />
            )}
        </Component>
    );
};

export default ScrollContainer;

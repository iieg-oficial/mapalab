import { useRef } from 'react';
import { useScrollOverflow } from '@hooks/useScrollOverflow';
import { HIDDEN_SCROLLBAR } from '@constants/global';
import Icon from '@components/Icon';

const ScrollContainer = ({
    children,
    className = '',
    showArrows = true,
    showMask = true,
    arrowIcon = 'downArrow',
    arrowClassName = 'w-3 h-3',
    hideScrollbar = true,
    as = 'div',
    ...props
}) => {
    const Component = as;
    const containerRef = useRef(null);
    const { canScrollUp, canScrollDown } = useScrollOverflow(containerRef);

    const getMaskClass = () => {
        if (!showMask) return '';
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
            {showArrows && canScrollUp && (
                <div className="sticky top-2 left-0 right-0 flex justify-center pointer-events-none z-10">
                    <Icon name={arrowIcon} className={`${arrowClassName} rotate-180 animate-[bounce_4s_ease-in-out_infinite]`} />
                </div>
            )}
            {children}
            {showArrows && canScrollDown && (
                <div className="sticky bottom-2 left-0 right-0 flex justify-center pointer-events-none z-10">
                    <Icon name={arrowIcon} className={`${arrowClassName} animate-[bounce_4s_ease-in-out_infinite]`} />
                </div>
            )}
        </Component>
    );
};

export default ScrollContainer;

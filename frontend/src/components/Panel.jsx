import { useEffect, useRef } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import Divider from '@components/Divider';
import { useFloatingPosition } from '@hooks/useFloatingPosition';

const Panel = ({
    open = true,
    anchorRef,
    onClose,
    title,
    children,
    footer,
    width = 'w-72',
    maxHeight = 'max-h-100',
    className = '',
    variant = 'solid',
    position,
    contentClassName = '',
    noPadding = false,
    flexDirection = 'flex-col',
    placement = 'right-start',
    mobileFullscreen = false,
}) => {
    const panelRef = useRef(null);
    const hasFloatingPosition = anchorRef != null;

    useFloatingPosition({
        open: hasFloatingPosition ? open : false,
        anchorRef,
        contentRef: panelRef,
        placement,
        offset: 12
    });

    useEffect(() => {
        if (!open || !onClose || !anchorRef) return;
        const handleClickOutside = (event) => {
            if (
                panelRef.current &&
                !panelRef.current.contains(event.target) &&
                anchorRef?.current &&
                !anchorRef.current.contains(event.target)
            ) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, onClose, anchorRef]);

    if (!open) return null;

    const closeLabel = title ? `Cerrar ${title}` : 'Cerrar panel';
    const baseStyles = variant === 'floating'
        ? 'bg-white/80 rounded-xl shadow'
        : 'bg-white rounded-2xl border border-black/10 shadow-2xl';

    const positionClass = position ? `absolute ${position}` : 'fixed';
    const showHeader = title || onClose;

    const mobileFullscreenClasses = mobileFullscreen
        ? 'max-md:inset-x-0 max-md:w-full max-md:h-auto max-md:rounded-t-2xl max-md:rounded-b-none'
        : '';

    const desktopSizeClasses = mobileFullscreen
        ? `md:${width} md:${maxHeight}`
        : `${width} ${maxHeight}`;

    return (
        <div
            ref={panelRef}
            className={`${positionClass} ${desktopSizeClasses} ${baseStyles} ${flexDirection} ${className} ${!showHeader && contentClassName} ${mobileFullscreenClasses} flex`}
        >
            {showHeader && (
                <>
                    <div className={`sticky top-0 ${variant === 'floating' ? 'bg-white/80' : 'bg-white'} ${noPadding ? 'p-0' : 'p-3'} flex items-center justify-between ${variant === 'floating' ? 'rounded-t-xl' : 'rounded-t-2xl'} ${mobileFullscreen ? 'max-md:rounded-none' : ''} shrink-0`}>
                        {title && (
                            <span className="text-xs font-semibold text-gray-600 ">
                                {title}
                            </span>
                        )}
                        {onClose && (
                            <Tooltip content={closeLabel} placement="left" delay={400}>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-gray-800"
                                    aria-label={closeLabel}
                                >
                                    <Icon name="close" />
                                </button>
                            </Tooltip>
                        )}
                    </div>
                    <Divider spacingClass="my-0" />
                </>
            )}

            {showHeader ? (
                <div className={`flex-1 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [scrollbar-width:none] ${contentClassName}`}>
                    {children}
                </div>
            ) : (
                children
            )}

            {footer && (
                <>
                    <Divider spacingClass="my-0" />
                    <div className={`sticky bottom-0 ${variant === 'floating' ? 'bg-white/80' : 'bg-white'} p-2 ${variant === 'floating' ? 'rounded-b-xl' : 'rounded-b-2xl'} ${mobileFullscreen ? 'max-md:rounded-none' : ''} shrink-0`}>
                        {footer}
                    </div>
                </>
            )}
        </div>
    );
};

export default Panel;


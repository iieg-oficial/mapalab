import { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import Divider from '@components/Divider';
import { useFloatingPosition } from '@hooks/useFloatingPosition';
import { useSiderMenuPosition } from '@hooks/useSiderMenuPosition';
import { useSider } from '@contexts/SiderContext';

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
    mobileFullscreen,
    disableMobileFullscreen = false,
    role = 'dialog',
    closeOnEscape = true,
    autoFocus = false,
    registerInSider = false,
    offset,
    shadow,
    rounded,
    bg,
    treatAsMobile: treatAsMobileProp,
}) => {
    const panelRef = useRef(null);
    const menuId = useId();
    const hasFloatingPosition = anchorRef != null;
    const siderContext = useSider();
    const isMobile = treatAsMobileProp ?? siderContext?.isMobile ?? false;

    const shouldUseMobileFullscreen = mobileFullscreen !== undefined
        ? mobileFullscreen
        : (variant === 'menu' && !disableMobileFullscreen);

    const shouldUseMenuPosition = variant === 'menu' && hasFloatingPosition;

    const menuPositionResult = useSiderMenuPosition({
        open: shouldUseMenuPosition ? open : false,
        anchorRef,
        contentRef: panelRef,
        placement,
        offset: offset ?? 8,
        mobileFullscreen: shouldUseMobileFullscreen,
        treatAsMobile: treatAsMobileProp
    });

    const isReady = shouldUseMenuPosition ? menuPositionResult.isReady : true;

    useFloatingPosition({
        open: hasFloatingPosition && variant !== 'menu' ? open : false,
        anchorRef,
        contentRef: panelRef,
        placement,
        offset: offset ?? 12
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
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [open, onClose, anchorRef]);

    useEffect(() => {
        if (open && registerInSider && siderContext) {
            siderContext.registerOpenMenu?.();
            return () => {
                siderContext.unregisterOpenMenu?.();
            };
        }
    }, [open, registerInSider, siderContext]);

    useEffect(() => {
        if (!open || !closeOnEscape || !onClose) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
                anchorRef?.current?.focus();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, closeOnEscape, onClose, anchorRef]);

    useEffect(() => {
        if (!open || !autoFocus || !panelRef.current) return;
        const focusable = panelRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable[0]?.focus({ preventScroll: true });
    }, [open, autoFocus]);

    if (!open) return null;

    const closeLabel = title ? `Cerrar ${title}` : 'Cerrar panel';
    const baseStyles = variant === 'floating'
        ? ''
        : variant === 'menu'
            ? 'border border-white-800 text-black backdrop-blur'
            : 'border border-black/10';

    const defaultShadow = variant === 'floating'
        ? 'shadow'
        : variant === 'menu'
            ? 'shadow-xl'
            : 'shadow-2xl';

    const shadowClass = shadow !== undefined ? shadow : defaultShadow;
    const defaultRounded = variant === 'menu' ? 'rounded-2xl' : variant === 'floating' ? 'rounded-xl' : 'rounded-2xl';
    const roundedClass = rounded !== undefined ? rounded : defaultRounded;
    const defaultBg = variant === 'floating' ? 'bg-white/80' : 'bg-white';
    const bgClass = bg !== undefined ? bg : defaultBg;
    const positionClass = position ? `absolute ${position}` : 'fixed';
    const showHeader = title || onClose;
    const mobileFullscreenClasses = shouldUseMobileFullscreen && isMobile
        ? 'inset-x-0 bottom-0 top-auto left-0! right-0! w-full h-auto max-h-[85vh] rounded-t-2xl rounded-b-none'
        : shouldUseMobileFullscreen && !isMobile
            ? `${width} ${maxHeight}`
            : '';

    const desktopSizeClasses = !shouldUseMobileFullscreen
        ? `${width} ${maxHeight}`
        : '';

    const mobileMenuClasses = variant === 'menu' && isMobile && !shouldUseMobileFullscreen
        ? 'left-0 right-0 mx-4'
        : variant === 'menu' && !isMobile && !shouldUseMobileFullscreen
            ? 'min-w-40'
            : '';

    const ariaProps = role === 'menu' ? {
        role: 'menu',
        'aria-labelledby': anchorRef ? `${menuId}-button` : undefined
    } : {
        role: role,
        ...(title && { 'aria-labelledby': `${menuId}-title` })
    };

    const panelContent = (
        <div
            ref={panelRef}
            id={role === 'menu' ? `${menuId}-content` : undefined}
            {...ariaProps}
            className={`
                ${positionClass}
                ${desktopSizeClasses}
                ${baseStyles}
                ${roundedClass}
                ${bgClass}
                ${flexDirection}
                ${className}
                ${!showHeader && contentClassName}
                ${mobileFullscreenClasses}
                ${mobileMenuClasses}
                ${shadowClass || ''}
                flex
                ${variant === 'menu' ? 'z-50 outline-none overflow-hidden' : ''}
                ${variant === 'menu' ? 'transition-opacity duration-150' : ''}
                ${variant === 'menu' && !isReady ? 'opacity-0' : 'opacity-100'}
            `}
            style={{
                ...(variant === 'menu' ? { position: 'fixed' } : {})
            }}
        >
            {variant === 'menu' ? (
                typeof children === 'function' ? children({ close: onClose }) : children
            ) : (
                <>
                    {showHeader && (
                        <>
                            <div className={`sticky top-0 ${bgClass} ${noPadding ? 'p-0' : 'p-3'} flex items-center justify-between ${variant === 'floating' ? 'rounded-t-xl' : 'rounded-t-2xl'} ${shouldUseMobileFullscreen ? 'max-md:rounded-none' : ''} shrink-0`}>
                                {title && (
                                    <span id={`${menuId}-title`} className="text-xs font-semibold text-gray-600 ">
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
                            {!hasFloatingPosition && <Divider spacingClass="my-0" />}
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
                            {!hasFloatingPosition && <Divider spacingClass="my-0" />}
                            <div className={`sticky bottom-0 ${bgClass} p-2 ${variant === 'floating' ? 'rounded-b-xl' : 'rounded-b-2xl'} ${shouldUseMobileFullscreen ? 'max-md:rounded-none' : ''} shrink-0`}>
                                {footer}
                            </div>
                        </>
                    )}
                </>
            )}
        </div>
    );

    if (variant === 'menu') {
        return createPortal(panelContent, document.body);
    }

    return panelContent;
};

export default Panel;

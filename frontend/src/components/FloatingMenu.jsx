import { useState, useEffect, useRef, useId, Fragment } from 'react';
import { useFloatingPosition } from '@hooks/useFloatingPosition';
import { useOutsideClick } from '@hooks/useOutsideClick';
import { useViewportContainment } from '@hooks/useViewportContainment';
import { useSider } from '@contexts/SiderContext';

const FloatingMenu = ({
    children,
    trigger,
    placement = 'bottom-start',
    initialOpen = false,
    open: controlledOpen,
    onOpenChange,
    closeOnItemClick = true,
    contentClassName = '',
}) => {
    const siderContext = useSider();
    const isMobile = siderContext?.isMobile || false;
    const isControlled = controlledOpen !== undefined;
    const [uncontrolled, setUncontrolled] = useState(initialOpen);
    const open = isControlled ? controlledOpen : uncontrolled;

    const setOpen = (v) => {
        if (!isControlled) setUncontrolled(v);
        onOpenChange?.(v);
    };

    const buttonRef = useRef(null);
    const contentRef = useRef(null);
    const menuId = useId();

    useFloatingPosition({ open, anchorRef: buttonRef, contentRef, placement });
    useOutsideClick([buttonRef, contentRef], () => open && setOpen(false));
    useViewportContainment(contentRef, [open]);

    useEffect(() => {
        if (open && siderContext) {
            siderContext.registerOpenMenu?.();
            return () => {
                siderContext.unregisterOpenMenu?.();
            };
        }
    }, [open, siderContext]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === 'Escape') {
                setOpen(false);
                buttonRef.current?.focus();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    useEffect(() => {
        if (!open || !contentRef.current) return;
        const focusable = contentRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        focusable[0]?.focus({ preventScroll: true });
    }, [open]);

    const api = {
        open,
        close: () => setOpen(false),
        toggle: () => setOpen(!open),
        buttonRef,
        contentRef,
        menuId,
        onItemClick: () => {
            if (closeOnItemClick) setOpen(false);
        },
    };

    return (
        <Fragment>
            {trigger?.({
                open,
                toggle: api.toggle,
                ref: buttonRef,
                props: {
                    id: `${menuId}-button`,
                    'aria-haspopup': 'menu',
                    'aria-expanded': open,
                    'aria-controls': `${menuId}-content`,
                    onClick: api.toggle,
                },
            })}
            {open && (
                <div
                    ref={contentRef}
                    id={`${menuId}-content`}
                    role='menu'
                    aria-labelledby={`${menuId}-button`}
                    className={`
                        fixed z-50 rounded-2xl
                        border border-white-800 bg-white text-black backdrop-blur
                        shadow-xl p-1 outline-none
                        overflow-y-auto
                        [&::-webkit-scrollbar]:hidden [scrollbar-width:none]
                        ${isMobile ? 'left-0 right-0 mx-4' : 'min-w-40'}
                        ${contentClassName}
                    `}
                    style={{ position: 'fixed' }}
                >
                    {typeof children === 'function' ? children(api) : children}
                </div>
            )}
        </Fragment>
    );
}

export default FloatingMenu;

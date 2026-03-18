import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useSider } from '@contexts/SiderContext';
import { HIDDEN_SCROLLBAR } from '@constants/global';
import Icon from '@components/Icon';

export const MobileMenuCloseButton = ({ onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className="text-gray-500 hover:text-gray-800 cursor-pointer ml-auto self-start"
        aria-label="Cerrar menú"
    >
        <Icon name="close" className="size-6" />
    </button>
);

const MobileMenu = ({
    open,
    onClose,
    children,
    registerInSider = false,
}) => {
    const menuRef = useRef(null);
    const siderContext = useSider();
    const siderRef = siderContext?.siderRef;

    useEffect(() => {
        if (open && registerInSider && siderContext) {
            siderContext.registerOpenMenu?.();
            return () => {
                siderContext.unregisterOpenMenu?.();
            };
        }
    }, [open, registerInSider, siderContext]);

    useEffect(() => {
        if (!open || !onClose) return;
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    useEffect(() => {
        if (!open || !onClose) return;
        const handleClickOutside = (event) => {
            const isInsideMenu = menuRef.current?.contains(event.target);
            const isInsideSider = siderRef?.current?.contains(event.target);
            if (!isInsideMenu && !isInsideSider) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside, { passive: true });
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
        };
    }, [open, onClose, siderRef]);

    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [open]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-50">
            <div
                className="absolute inset-0 bg-black/30 transition-opacity duration-300"
                style={{ opacity: open ? 1 : 0 }}
                onClick={onClose}
            />
            <div
                ref={menuRef}
                className={`
                    absolute bottom-0 left-0 right-0
                    bg-[#F9FBFF] rounded-t-2xl
                    max-h-[85vh] flex flex-col overflow-hidden
                    shadow-[0_-5px_20px_#1A26641A]
                    transform transition-transform duration-300 ease-out
                `}
                style={{
                    transform: open ? 'translateY(0)' : 'translateY(100%)'
                }}
            >
                {typeof children === 'function' ? children({ close: onClose }) : children}
            </div>
        </div>,
        document.body
    );
};

export default MobileMenu;

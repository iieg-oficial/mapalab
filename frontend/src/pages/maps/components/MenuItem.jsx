import { useState, useRef, useEffect } from 'react';
import Panel from '@components/Panel';
import MobileMenu, { MobileMenuCloseButton } from './MobileMenu';

const MenuItem = ({ item, isMobileView, autoOpenMenuId, clearAutoOpenMenu }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const buttonRef = useRef(null);
    const hasAutoOpenedRef = useRef(false);

    useEffect(() => {
        if (autoOpenMenuId === item.id && !hasAutoOpenedRef.current) {
            hasAutoOpenedRef.current = true;
            setIsMenuOpen(true);
            clearAutoOpenMenu();
        }
    }, [autoOpenMenuId, item.id, clearAutoOpenMenu]);

    if (!item.hasMenu) {
        if (item.onClick) {
            return (
                <button type="button" ref={item.ref} onClick={item.onClick} className="cursor-pointer w-full">
                    {item.component}
                </button>
            );
        }
        return item.component;
    }

    const handleClose = () => setIsMenuOpen(false);

    return (
        <>
            <button
                type="button"
                ref={(node) => {
                    buttonRef.current = node;
                    if (typeof item.ref === 'function') item.ref(node);
                    else if (item.ref) item.ref.current = node;
                }}
                id={`menu-button-${item.id}`}
                aria-haspopup="menu"
                aria-expanded={isMenuOpen}
                aria-controls={`menu-content-${item.id}`}
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="cursor-pointer w-full text-left"
            >
                {item.renderComponent ? item.renderComponent({ isMenuOpen }) : item.component}
            </button>
            {isMobileView ? (
                <MobileMenu
                    open={isMenuOpen}
                    onClose={handleClose}
                    registerInSider={true}
                >
                    {item.menuContent({
                        close: handleClose,
                        closeButton: <MobileMenuCloseButton onClick={handleClose} />
                    })}
                </MobileMenu>
            ) : (
                <Panel
                    open={isMenuOpen}
                    onClose={handleClose}
                    anchorRef={buttonRef}
                    variant="menu"
                    role="menu"
                    closeOnEscape={true}
                    // eslint-disable-next-line jsx-a11y/no-autofocus -- menus abren con foco para navegación de teclado esperada
                    autoFocus={true}
                    registerInSider={true}
                    width="w-88"
                    maxHeight="max-h-200"
                    noPadding={true}
                    className="border-none"
                    shadow="shadow-none"
                    offset={10}
                    placement={item.panelPlacement || 'right-start'}
                    rounded={item.panelRounded || 'rounded-r-2xl'}
                    bg="bg-[#F9FBFF] shadow-[0_5px_20px_#1A26641A]"
                >
                    {item.menuContent({
                        close: handleClose,
                        closeButton: <MobileMenuCloseButton onClick={handleClose} />
                    })}
                </Panel>
            )}
        </>
    );
};

export default MenuItem;

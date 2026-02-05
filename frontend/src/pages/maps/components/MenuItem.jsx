import { useState, useRef, useEffect } from 'react';
import Panel from '@components/Panel';
import MobileMenu from './MobileMenu';

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
                <div ref={item.ref} onClick={item.onClick} className="cursor-pointer">
                    {item.component}
                </div>
            );
        }
        return item.component;
    }

    const handleClose = () => setIsMenuOpen(false);

    return (
        <>
            <button
                type="button"
                ref={buttonRef}
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
                    {item.menuContent({ close: handleClose })}
                </MobileMenu>
            ) : (
                <Panel
                    open={isMenuOpen}
                    onClose={handleClose}
                    anchorRef={buttonRef}
                    variant="menu"
                    role="menu"
                    closeOnEscape={true}
                    autoFocus={true}
                    registerInSider={true}
                    width="w-88"
                    maxHeight="max-h-200"
                    noPadding={true}
                    className="border-none"
                    shadow="shadow-none"
                    offset={10}
                    rounded="rounded-r-2xl"
                    bg="bg-[#F9FBFF] shadow-[0_5px_20px_#1A26641A]"
                >
                    {item.menuContent({ close: handleClose })}
                </Panel>
            )}
        </>
    );
};

export default MenuItem;

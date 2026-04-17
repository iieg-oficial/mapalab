import { useEffect } from 'react';
import { useSider } from '@contexts/SiderContext';
import MobileSheet, { MobileSheetCloseButton } from '@components/MobileSheet';

export const MobileMenuCloseButton = MobileSheetCloseButton;

const MobileMenu = ({
    open,
    onClose,
    children,
    registerInSider = false
}) => {
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

    return (
        <MobileSheet
            open={open}
            onClose={onClose}
            excludeRefs={siderRef ? [siderRef] : []}
        >
            {children}
        </MobileSheet>
    );
};

export default MobileMenu;

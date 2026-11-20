import { useEffect } from 'react';

const ID_BUSCADOR = 'buscador-capas';

const enfocarBuscador = () => {
    const input = document.getElementById(ID_BUSCADOR);
    if (!input) return false;
    input.focus({ preventScroll: true });
    input.select();
    return true;
};

const useAtajosDelSider = ({ isMobile, handleToggleLock, setIsHovered, setAutoOpenMenuId }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            const tecla = e.key.toLowerCase();
            if (e.altKey && tecla === 'b') {
                e.preventDefault();
                if (!isMobile) handleToggleLock();
                return;
            }
            if ((e.ctrlKey || e.metaKey) && tecla === 'k') {
                e.preventDefault();
                if (enfocarBuscador()) return;
                setIsHovered(true);
                setAutoOpenMenuId('search');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isMobile, handleToggleLock, setIsHovered, setAutoOpenMenuId]);
};

export default useAtajosDelSider;

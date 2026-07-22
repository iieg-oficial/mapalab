import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router';

export const CATALOGO_RETURN_KEY = 'mapalab:returnUrl';

export const useGoToCatalogo = () => {
    const navigate = useNavigate();
    const location = useLocation();
    return useCallback(() => {
        try {
            sessionStorage.setItem(CATALOGO_RETURN_KEY, location.pathname + location.search);
        } catch {
            /* sessionStorage no disponible */
        }
        navigate('/catalogo');
    }, [navigate, location]);
};

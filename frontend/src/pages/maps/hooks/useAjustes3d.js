import { useCallback, useEffect, useState } from 'react';
import { AJUSTES_3D_DEFAULT, guardarAjustes3d, leerAjustesGuardados, normalizarAjustes3d } from '@pages/maps/helpers/ajustes3d';

export const useAjustes3d = (llave) => {
    const [ajustes, setAjustes] = useState(() => leerAjustesGuardados(llave));

    useEffect(() => {
        guardarAjustes3d(ajustes, llave);
    }, [ajustes, llave]);

    const setAjuste = useCallback((clave, valor) => {
        setAjustes(prev => normalizarAjustes3d({ ...prev, [clave]: valor }));
    }, []);
    const reemplazarAjustes = useCallback((nuevos) => setAjustes(normalizarAjustes3d({ ...AJUSTES_3D_DEFAULT, ...nuevos })), []);
    const restablecerAjustes = useCallback(() => setAjustes({ ...AJUSTES_3D_DEFAULT }), []);

    return { ajustes, setAjuste, reemplazarAjustes, restablecerAjustes };
};

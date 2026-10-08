import { useEffect, useState } from 'react';
import { formatosDeVideo } from '@pages/maps/helpers/grabacion/codificador';

let cache = null;

export const useFormatosVideo = () => {
    const [soporte, setSoporte] = useState(() => cache || { mp4: false, webm: false });
    useEffect(() => {
        if (cache) return undefined;
        let vigente = true;
        formatosDeVideo().then((resultado) => {
            cache = resultado;
            if (vigente) setSoporte(resultado);
        });
        return () => { vigente = false; };
    }, []);
    return soporte;
};

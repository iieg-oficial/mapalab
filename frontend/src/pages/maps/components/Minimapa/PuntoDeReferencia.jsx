import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

const centroDelLienzo = (map) => {
    const caja = map?.getTargetElement?.()?.getBoundingClientRect();
    if (!caja?.width) return null;
    return { left: caja.left + caja.width / 2, top: caja.top + caja.height / 2 };
};

const PuntoDeReferencia = ({ map }) => {
    const [centro, setCentro] = useState(() => centroDelLienzo(map));

    useEffect(() => {
        const medir = () => setCentro(centroDelLienzo(map));
        medir();
        window.addEventListener('resize', medir);
        map?.on?.('change:size', medir);
        return () => {
            window.removeEventListener('resize', medir);
            map?.un?.('change:size', medir);
        };
    }, [map]);

    if (!centro) return null;
    return createPortal(
        <span
            aria-hidden="true"
            data-punto-minimapa
            className="pointer-events-none fixed z-10 size-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple/35 ring-1 ring-white/70"
            style={centro}
        />,
        document.body,
    );
};

export default PuntoDeReferencia;

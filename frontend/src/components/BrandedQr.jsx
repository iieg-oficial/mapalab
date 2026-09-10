import { useEffect, useRef, useState } from 'react';
import { cargarQr, opcionesQr } from '@utils/brandedQr';

const BrandedQr = ({ url, size = 200, className = '' }) => {
    const contenedorRef = useRef(null);
    const [fallo, setFallo] = useState(false);

    useEffect(() => {
        if (!url || !contenedorRef.current) return undefined;
        let cancelado = false;
        setFallo(false);
        cargarQr()
            .then((QRCodeStyling) => {
                if (cancelado || !contenedorRef.current) return;
                contenedorRef.current.replaceChildren();
                new QRCodeStyling(opcionesQr(url, size)).append(contenedorRef.current);
            })
            .catch(() => { if (!cancelado) setFallo(true); });
        return () => { cancelado = true; };
    }, [url, size]);

    if (fallo) {
        return (
            <p className="text-[11px] font-garet text-graphite text-center">
                No se pudo generar el código QR.
            </p>
        );
    }

    return (
        <div
            ref={contenedorRef}
            className={`rounded-[10px] overflow-hidden shrink-0 ${className}`}
            style={{ width: size, height: size }}
        />
    );
};

export default BrandedQr;

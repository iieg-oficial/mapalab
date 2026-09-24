import { useCallback, useEffect, useRef } from 'react';
import { useMunicipioMask } from '@hooksMaps/useMunicipioMask';
import { useMunicipioFit } from '@hooksMaps/useMunicipioFit';

export const useCatalogoMunicipioMapa = ({ mapRef, municipio }) => {
    useMunicipioMask({ active: municipio.active, geometries: municipio.geometries, mapRef });
    const encuadrar = useMunicipioFit({ municipioMode: municipio, mapRef });
    const activoRef = useRef(municipio.active);
    const encuadrarRef = useRef(encuadrar);

    useEffect(() => {
        activoRef.current = municipio.active;
        encuadrarRef.current = encuadrar;
    }, [municipio.active, encuadrar]);

    return useCallback(() => activoRef.current && encuadrarRef.current(), []);
};

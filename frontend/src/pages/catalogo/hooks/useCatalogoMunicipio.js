import { useEffect, useMemo, useRef } from 'react';
import { useMunicipioMode } from '@hooksMaps/useMunicipioMode';
import { buildLayerMunicipioCql } from '@pages/maps/helpers/municipioCqlBuilder';

export const PARAM_MUNICIPIOS = 'municipios';

export const municipiosDeParam = (valor) => (valor ? valor.split(',').map((c) => c.trim()).filter(Boolean) : []);

export const metaMunicipio = (capa) => (capa?.municipioField
    ? { hasMunicipio: true, municipioField: capa.municipioField, municipioFieldType: capa.municipioFieldType || 'clave' }
    : null);

export const useCatalogoMunicipio = (capa, { initialMunicipios = null, onMunicipiosChange } = {}) => {
    const capasBase = useMemo(() => (capa?.geoserverLayer ? [capa.geoserverLayer] : []), [capa?.geoserverLayer]);
    const municipio = useMunicipioMode({ activeLayerIds: capasBase });
    const meta = useMemo(() => metaMunicipio(capa), [capa]);
    const pendientesRef = useRef(municipiosDeParam(initialMunicipios));
    const municipioRef = useRef(municipio);
    municipioRef.current = municipio;
    const onCambioRef = useRef(onMunicipiosChange);
    onCambioRef.current = onMunicipiosChange;

    useEffect(() => {
        if (!capa) return;
        const modo = municipioRef.current;
        if (!meta) {
            if (pendientesRef.current.length) onCambioRef.current?.(null);
            pendientesRef.current = [];
            if (modo.active) modo.exit();
            return;
        }
        const pendientes = pendientesRef.current;
        pendientesRef.current = [];
        if (pendientes.length && !modo.active) modo.enter(pendientes, { fromUrl: true });
    }, [capa, meta]);

    const { active, selected } = municipio;
    const param = active && selected.length ? selected.join(',') : null;
    useEffect(() => {
        if (pendientesRef.current.length) return;
        onCambioRef.current?.(param);
    }, [param]);

    const filtroMunicipio = useMemo(
        () => (meta ? buildLayerMunicipioCql(meta, municipio.municipioContext, capa?.slug) : null),
        [meta, municipio.municipioContext, capa?.slug],
    );

    return { municipio, disponible: Boolean(meta), filtroMunicipio };
};

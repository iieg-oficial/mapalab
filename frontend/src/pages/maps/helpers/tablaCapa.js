import { canUseVectorService } from './serviceMode';
import { RASTER_WORKSPACES } from './layerCqlSegment';

const typeNameDe = (wmsConfig) => wmsConfig?.wfsLayerName || wmsConfig?.layerName || null;

export const hojasConTabla = (layerDef) => {
    if (!layerDef) return [];
    if (!Array.isArray(layerDef.children) || layerDef.children.length === 0) {
        return canUseVectorService(layerDef) ? [layerDef] : [];
    }
    return layerDef.children.flatMap(hojasConTabla);
};

export const resolverObjetivo = (layerDef) => {
    if (!layerDef) return { wmsConfig: null, esGrupo: false, motivo: 'No se encontró la capa.' };

    const esGrupo = Array.isArray(layerDef.children) && layerDef.children.length > 0;
    if (!esGrupo) {
        if (canUseVectorService(layerDef) && layerDef.wmsConfig?.baseUrl) {
            return { wmsConfig: layerDef.wmsConfig, esGrupo: false, motivo: null };
        }
        if (RASTER_WORKSPACES.has(layerDef.wmsConfig?.workspace)) {
            return { wmsConfig: null, esGrupo: false, motivo: 'Esta capa es una imagen: no tiene tabla de datos.' };
        }
        return { wmsConfig: null, esGrupo: false, motivo: 'Esta capa no publica sus datos.' };
    }

    const hojas = hojasConTabla(layerDef).filter(hoja => hoja.wmsConfig?.baseUrl);
    if (hojas.length === 0) {
        return { wmsConfig: null, esGrupo: true, motivo: 'Ninguna capa de este grupo publica sus datos.' };
    }

    const typeNames = new Set(hojas.map(hoja => typeNameDe(hoja.wmsConfig)));
    const primera = hojas[0].wmsConfig;

    if (typeNames.size === 1) {
        const sinFiltro = { ...primera };
        delete sinFiltro.cqlFilter;
        return {
            wmsConfig: hojas.length > 1 ? sinFiltro : primera,
            esGrupo: true,
            hojas: hojas.length,
            capas: hojas,
            motivo: null,
        };
    }

    return { wmsConfig: primera, esGrupo: true, hojas: hojas.length, capas: hojas, motivo: null };
};

export const reordenarActivas = (ordenTablas, tablas, activeLayerIds) => {
    const activas = Array.isArray(activeLayerIds) ? activeLayerIds : [];
    const hojasDe = new Map((tablas || []).map(tabla => [tabla.id, tabla.childIds || [tabla.id]]));
    const usados = new Set();
    const resultado = [];

    for (const id of ordenTablas || []) {
        for (const hoja of hojasDe.get(id) || [id]) {
            if (activas.includes(hoja) && !usados.has(hoja)) {
                resultado.push(hoja);
                usados.add(hoja);
            }
        }
    }

    for (const id of activas) {
        if (!usados.has(id)) resultado.push(id);
    }

    return resultado;
};

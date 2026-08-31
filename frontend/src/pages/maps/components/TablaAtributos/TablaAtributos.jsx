import { useMemo, useRef } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useIsMobile } from '@hooks/useIsMobile';
import { useClearance } from '@hooks/useClearance';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';
import { findLayerDef } from '@pages/maps/helpers/wmsConfig';
import { descriptorVacio, etiquetaFiltro } from '@pages/maps/helpers/tablaCqlBuilder';
import BarraEstado from './BarraEstado';
import Ventana from './Ventana';

const CONTROLES_DEL_MAPA = ['.ol-scale-line', '.ol-attribution'];

const TablaAtributos = () => {
    const { allLayers } = useMapsContext();
    const {
        activo, tablas, activaId, minimizado, estadoDe, quitarFiltro, limpiarFiltros,
        fijarExpresionPropia,
    } = useTablaAtributos();
    const isMobile = useIsMobile();
    const barraRef = useRef(null);
    const inferior = useClearance(barraRef, {
        lado: 'bottom',
        obstaculos: CONTROLES_DEL_MAPA,
        base: isMobile ? 68 : 12,
        separacion: 8,
        activo: minimizado && tablas.length > 0,
    });

    const nombreDe = useMemo(() => (layerId) => {
        const layerDef = findLayerDef(layerId, allLayers || []);
        return layerDef?.label || layerDef?.name || 'Capa';
    }, [allLayers]);

    const estadoActiva = activaId ? estadoDe(activaId) : null;

    const chips = useMemo(() => {
        if (!estadoActiva) return [];
        if (estadoActiva.expresionPropia) {
            return [{ columna: null, etiqueta: 'expresión propia', propia: true }];
        }
        return Object.entries(estadoActiva.filtros)
            .filter(([, descriptor]) => !descriptorVacio(descriptor))
            .map(([columna, descriptor]) => ({ columna, etiqueta: etiquetaFiltro(columna, descriptor) }));
    }, [estadoActiva]);

    if (!activo || tablas.length === 0) return null;

    const quitarChip = (columna) => {
        if (columna === null) fijarExpresionPropia(activaId, null);
        else quitarFiltro(activaId, columna);
    };

    return (
        <>
            {tablas.map((layerId, indice) => (
                <Ventana
                    key={layerId}
                    layerId={layerId}
                    indice={indice}
                    activa={layerId === activaId}
                    minimizada={minimizado || layerId !== activaId}
                    esMovil={isMobile}
                    nombreDe={nombreDe}
                />
            ))}
            {minimizado && (
                <div ref={barraRef}>
                    <BarraEstado
                        nombreDe={nombreDe}
                        chips={chips}
                        vista={estadoActiva?.vista || 'libre'}
                        onQuitarChip={quitarChip}
                        onLimpiarChips={() => limpiarFiltros(activaId)}
                        inferior={inferior}
                    />
                </div>
            )}
        </>
    );
};

export default TablaAtributos;

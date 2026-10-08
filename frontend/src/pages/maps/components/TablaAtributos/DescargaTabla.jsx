import { useMemo } from 'react';
import Icon from '@components/Icon';
import Loading from '@components/Loading';
import ActionIconButton from '@components/ActionIconButton';
import DownloadMenu from '@mapsComponents/LayerDetailModal/components/DownloadMenu';
import { useMapsContext } from '@hooks/useMaps';
import { useLayerDownload } from '@hooksMaps/useLayerDownload';
import { useLayerMetadata, useMetadataContext } from '@hooksMaps/useLayerMetadata';
import { trackTablaDownload } from '@services/analyticsService';

const DescargaTabla = ({ layerId, cql, columnas, campoGeometria }) => {
    const { getFilter, getSpecificFilter, municipioMode } = useMapsContext();
    const contexto = useMetadataContext(municipioMode);
    const { metadata } = useLayerMetadata(layerId, contexto);

    const propertyNames = useMemo(() => {
        const visibles = (columnas || []).filter(columna => columna.visible).map(columna => columna.nombre);
        if (visibles.length === 0 || visibles.length === (columnas || []).length) return null;
        return campoGeometria ? [...visibles, campoGeometria] : visibles;
    }, [campoGeometria, columnas]);

    const descarga = useLayerDownload(layerId, {
        getFilter,
        getSpecificFilter,
        metadata,
        cqlBase: cql || null,
        propertyNames,
    });

    return (
        <span ref={descarga.menuAnchorRef} className="flex">
            <ActionIconButton
                onClick={descarga.downloading
                    ? descarga.handleCancelDownload
                    : () => descarga.setMenuOpen(previo => !previo)}
                activo={descarga.downloading}
                titulo={descarga.downloading
                    ? 'Cancelar la descarga'
                    : 'Descargar lo que muestra la tabla: los registros con los filtros puestos y las columnas visibles, no la capa completa'}
                etiqueta={descarga.downloading ? 'Cancelar la descarga' : 'Descargar los datos de la tabla'}
                tamano="sm"
            >
                {descarga.downloading
                    ? <Loading visible size="size-3.5" border="border-1" color="border-current" />
                    : <Icon name="download" className="size-3.5" />}
            </ActionIconButton>

            <DownloadMenu
                open={descarga.menuOpen}
                anchorRef={descarga.menuAnchorRef}
                onClose={() => descarga.setMenuOpen(false)}
                isRaster={descarga.isRaster}
                hasDateFilter={descarga.hasDateFilter}
                availableMetadata={descarga.availableMetadata}
                onDownload={(opciones) => {
                    trackTablaDownload(layerId, opciones?.formatId);
                    descarga.handleMenuDownload(opciones);
                }}
            />
        </span>
    );
};

export default DescargaTabla;

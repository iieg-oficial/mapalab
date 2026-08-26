import 'ol/ol.css';
import SEO from '@components/SEO';
import MapView from '@mapsComponents/MapView';
import SwipeView from '@mapsComponents/SwipeView';
import SwipeSlotControls from '@mapsComponents/SwipeSlotControls';
import MapSider from '@mapsComponents/MapSider';
import MapToolsPanel from '@mapsComponents/MapToolsPanel';
import MunicipioActiveChip from '@mapsComponents/MapExport/MunicipioActiveChip';
import MapLayersPanels from '@mapsComponents/MapLayersPanels';
import LayerDetailModal from './components/LayerDetailModal/LayerDetailModal';
import NumeraliaPanel from './components/NumeraliaPanel';
import InfoBox from './components/InfoBox/InfoBox';
import MapControls from './components/MapControls';
import MeasurementTools from './components/MeasurementTools/ToolsPanel';
import ScaleLineControl from './components/ScaleLineControl';
import MapAttribution from './components/MapAttribution';
import LayerNotices from './components/LayerNotices/LayerNotices';
import { useInitializeFromUrl } from './hooks/useInitializeFromUrl';
import { useSessionPersistence } from './hooks/useSessionPersistence';
import { SiderProvider } from '@contexts/SiderContext';
import { ZenModeProvider } from './components/ZenMode';
import { NumeraliaPanelProvider } from '@contexts/NumeraliaPanelContext';
import useThemeColor from '@hooks/useThemeColor';
import { useMapsContext } from '@hooks/useMaps';

const Maps = () => {
    useThemeColor('#ffffff');
    useInitializeFromUrl();
    useSessionPersistence();
    const { compareMode } = useMapsContext();
    const isComparing = !!compareMode?.active;

    return (
        <SiderProvider>
            <ZenModeProvider>
                <NumeraliaPanelProvider>
                    <SEO
                        title="Mapa Interactivo | Mapalab"
                        description="Mapa interactivo de Jalisco con capas geoespaciales: temperatura, precipitación, recursos naturales, eventos y más. Herramienta oficial del IIEG para consulta y análisis territorial."
                        schemaType="WebApplication"
                        keywords="mapa interactivo Jalisco, capas geoespaciales Jalisco, mapa temperatura Jalisco, mapa precipitación Jalisco, mapa recursos naturales Jalisco, IIEG, GeoServer Jalisco"
                    />
                    <h1 className="sr-only">Mapa interactivo de Jalisco con capas geoespaciales — MapaLab IIEG</h1>
                    <p className="sr-only">
                    Herramienta oficial del Instituto de Información Estadística y Geográfica de Jalisco (IIEG) para visualizar el mapa de Jalisco con capas temáticas: temperatura, precipitación, recursos naturales, eventos, infraestructura y datos estadísticos del estado.
                    </p>
                    <div className="relative w-full h-dvh">
                        <MapSider />
                        <MapToolsPanel />
                        <MunicipioActiveChip />
                        <MapLayersPanels />
                        <LayerDetailModal />
                        <NumeraliaPanel />
                        <InfoBox />
                        <ScaleLineControl />
                        <MapAttribution />
                        <MapControls />
                        {!isComparing && <MeasurementTools />}
                        {isComparing ? <SwipeView /> : <MapView />}
                        {isComparing && <SwipeSlotControls />}
                        <LayerNotices />
                    </div>
                </NumeraliaPanelProvider>
            </ZenModeProvider>
        </SiderProvider>
    );
};

export default Maps;


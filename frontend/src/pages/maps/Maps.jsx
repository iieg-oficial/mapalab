import 'ol/ol.css';
import SEO from '@components/SEO';
import MapView from '@mapsComponents/MapView';
import SwipeView from '@mapsComponents/SwipeView';
import SwipeSlotControls from '@mapsComponents/SwipeSlotControls';
import SwipeSlotPickerModal from '@mapsComponents/SwipeSlotPickerModal';
import MapSider from '@mapsComponents/MapSider';
import MapToolsPanel from '@mapsComponents/MapToolsPanel';
import MapLayersPanels from '@mapsComponents/MapLayersPanels';
import LayerDetailModal from './components/LayerDetailModal/LayerDetailModal';
import InfoBox from './components/InfoBox/InfoBox';
import MapControls from './components/MapControls';
import MeasurementTools from './components/MeasurementTools/ToolsPanel';
import ScaleLineControl from './components/ScaleLineControl';
import MapAttribution from './components/MapAttribution';
import { useInitializeFromUrl } from './hooks/useInitializeFromUrl';
import { useSessionPersistence } from './hooks/useSessionPersistence';
import { SiderProvider } from '@contexts/SiderContext';
import { ZenModeProvider } from './components/ZenMode';
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
                <SEO
                    title="Mapa Interactivo | Mapalab"
                    description="Visualiza capas de información geoespacial de Jalisco: temperatura, precipitación, recursos naturales y más."
                    path="mapa"
                    schemaType="WebApplication"
                />
                <div className="relative w-full h-dvh">
                    <MapSider />
                    <MapToolsPanel />
                    <MapLayersPanels />
                    <LayerDetailModal />
                    {!isComparing && <InfoBox />}
                    <ScaleLineControl />
                    <MapAttribution />
                    <MapControls />
                    {!isComparing && <MeasurementTools />}
                    {isComparing ? <SwipeView /> : <MapView />}
                    {isComparing && <SwipeSlotControls />}
                    <SwipeSlotPickerModal />
                </div>
            </ZenModeProvider>
        </SiderProvider>
    );
};

export default Maps;


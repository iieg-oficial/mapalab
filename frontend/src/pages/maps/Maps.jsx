import 'ol/ol.css';
import SEO from '@components/SEO';
import MapView from '@mapsComponents/MapView';
import MapSider from '@mapsComponents/MapSider';
import MapToolsPanel from '@mapsComponents/MapToolsPanel';
import MapLayersPanels from '@mapsComponents/MapLayersPanels';
import LayerDetailModal from './components/LayerDetailModal/LayerDetailModal';
import InfoBox from './components/InfoBox/InfoBox';
import MapControls from './components/MapControls';
import MeasurementTools from './components/MeasurementTools/ToolsPanel';
import ScaleLineControl from './components/ScaleLineControl';
import { useInitializeFromUrl } from './hooks/useInitializeFromUrl';
import { useUrlSync } from './hooks/useUrlSync';
import { SiderProvider } from '@contexts/SiderContext';
import { ZenModeProvider } from './components/ZenMode';

const Maps = () => {
    useInitializeFromUrl();
    useUrlSync();

    return (
        <SiderProvider>
            <ZenModeProvider>
                <SEO
                    title="Mapa Interactivo | Mapalab"
                    description="Visualiza capas de información geoespacial de Jalisco: temperatura, precipitación, recursos naturales y más."
                    path="mapa"
                    schemaType="WebApplication"
                />
                <div className="relative w-full h-screen">
                    <MapSider />
                    <MapToolsPanel />
                    <MapLayersPanels />
                    <LayerDetailModal />
                    <InfoBox />
                    <ScaleLineControl />
                    <MapControls />
                    <MeasurementTools />
                    <MapView />
                </div>
            </ZenModeProvider>
        </SiderProvider>
    );
};

export default Maps;


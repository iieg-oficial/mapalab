import MapView from '@mapsComponents/MapView';
import MapSider from '@mapsComponents/MapSider';
import MapToolsPanel from '@mapsComponents/MapToolsPanel';
import MapLayersPanels from '@mapsComponents/MapLayersPanels';
import LayerDetailModal from './components/LayerDetailModal/LayerDetailModal';
import FeatureInfoPanel from './components/FeatureInfoPanel/FeatureInfoPanel';
import MapControls from './components/MapControls';
import MeasurementTools from './components/MeasurementTools/ToolsPanel';
import ScaleLineControl from './components/ScaleLineControl';
import GlobalLoading from './components/GlobalLoading';
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
                <div className="relative w-full h-screen">
                    <MapSider />
                    <GlobalLoading />
                    <MapToolsPanel />
                    <MapLayersPanels />
                    <LayerDetailModal />
                    <FeatureInfoPanel />
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


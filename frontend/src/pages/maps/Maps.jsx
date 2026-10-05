import 'ol/ol.css';
import { lazy, Suspense } from 'react';
import SEO from '@components/SEO';
import MapView from '@mapsComponents/MapView';
import MapaConAcople from './components/TablaAtributos/MapaConAcople';
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
import { TablaAtributosProvider } from '@contexts/TablaAtributosContext';
import { AreaUtilProvider } from '@contexts/AreaUtilContext';
import TablaAtributos from './components/TablaAtributos/TablaAtributos';
import DockPills from './components/DockPills';
import useThemeColor from '@hooks/useThemeColor';
import { useMapsContext } from '@hooks/useMaps';
import { View3dProvider, useView3d } from '@contexts/View3dContext';
import { DronProvider } from '@contexts/DronContext';
import { CaminarProvider } from '@contexts/CaminarContext';
import AvisoCapasPrivadas from '@mapsComponents/Sesion/AvisoCapasPrivadas';
import { GrabacionDronProvider } from '@contexts/GrabacionDronContext';
import DronOverlay from './components/Dron/DronOverlay';
import OcultoEnDronMovil from './components/Dron/OcultoEnDronMovil';

const Map3DView = lazy(() => import('@mapsComponents/Map3D/Map3DView'));
const Map3DSwipe = lazy(() => import('@mapsComponents/Map3D/Map3DSwipe'));

const MapaPrincipal = ({ isComparing }) => {
    const { active } = useView3d();
    return (
        <>
            {!isComparing && !active && <MeasurementTools />}
            <ScaleLineControl />
            <MapaConAcople>
                {isComparing ? <SwipeView /> : <MapView />}
                {active && <Suspense fallback={null}>{isComparing ? <Map3DSwipe /> : <Map3DView />}</Suspense>}
            </MapaConAcople>
            {active && !isComparing && <DronOverlay />}
        </>
    );
};

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
                    <AreaUtilProvider>
                        <TablaAtributosProvider>
                            <View3dProvider>
                                <DronProvider>
                                    <CaminarProvider>
                                        <GrabacionDronProvider>
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
                                                <OcultoEnDronMovil><MapToolsPanel /></OcultoEnDronMovil>
                                                <MunicipioActiveChip />
                                                <OcultoEnDronMovil><MapLayersPanels /></OcultoEnDronMovil>
                                                <LayerDetailModal />
                                                <NumeraliaPanel />
                                                <InfoBox />
                                                <MapAttribution />
                                                <MapControls conMinimapa />
                                                <MapaPrincipal isComparing={isComparing} />
                                                {isComparing && <SwipeSlotControls />}
                                                <LayerNotices />
                                                <AvisoCapasPrivadas />
                                                <DockPills />
                                                <TablaAtributos />
                                            </div>
                                        </GrabacionDronProvider>
                                    </CaminarProvider>
                                </DronProvider>
                            </View3dProvider>
                        </TablaAtributosProvider>
                    </AreaUtilProvider>
                </NumeraliaPanelProvider>
            </ZenModeProvider>
        </SiderProvider>
    );
};

export default Maps;


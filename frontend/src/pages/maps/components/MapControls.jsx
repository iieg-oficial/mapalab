import { useMapsContext } from '@hooks/useMaps';
import { ZOOM_ANIMATION_MS } from '@pages/maps/helpers/defaultView';
import { useSiderAdaptivePosition, useSider } from '@contexts/SiderContext';
import { getFitPadding, ACTIVE_LAYERS_PANEL_WIDTH } from '@pages/maps/helpers/mapFit';
import { useCallback, useState } from 'react';
import { transformExtent } from 'ol/proj';
import Icon from '@components/Icon';
import { trackMapZoomLevel } from '@services/analyticsService';
import { JALISCO_BOUNDS } from '@pages/maps/helpers/wmsConfig';
import { useAreaUtil } from '@contexts/AreaUtilContext';
import { useView3d } from '@contexts/View3dContext';
import { useDron } from '@contexts/DronContext';
import Map3DBar from './Map3D/Map3DBar';
import Map3DAyuda from './Map3D/Map3DAyuda';
import Tooltip from '@components/Tooltip';
import PillCloseButton from '@components/PillCloseButton';
import Badge from '@components/Badge';
import BotonNorte from './BotonNorte';
import { useMiUbicacion } from '@hooksMaps/useMiUbicacion';


const MapControls = ({ hideLocate = false, hideEncuadrar = false }) => {
    const { mapRef, compareMode, paneMapRefs, isLocating, setIsLocating, municipioMode } = useMapsContext();
    const [hoveredButton, setHoveredButton] = useState(null);
    const { style, className } = useSiderAdaptivePosition({ bottomOffset: 180 });
    const { width: siderWidth, isMobile } = useSider();
    const { margenes } = useAreaUtil();
    const isSwipe = !!compareMode?.active;
    const view3d = useView3d();
    const dron = useDron();
    const soloPastilla = dron.activo && isMobile;
    const view3dTitle = !view3d.available
        ? 'Tu navegador no tiene WebGL2, necesario para la vista 3D'
        : `Cambiar a vista ${view3d.active ? '2D' : '3D'}`;
    const get3d = useCallback(() => (view3d.active ? view3d.map3dRef.current : null), [view3d.active, view3d.map3dRef]);

    const getActiveMap = useCallback(() => {
        if (isSwipe) return paneMapRefs?.current?.[0]?.current ?? null;
        return mapRef?.current ?? null;
    }, [isSwipe, mapRef, paneMapRefs]);

    const handleZoomIn = useCallback(() => {
        const map3d = get3d();
        if (map3d) { map3d.zoomIn(); return; }
        const map = getActiveMap();
        if (!map) return;

        const view = map.getView();
        const currentZoom = view.getZoom();
        const maxZoom = view.getMaxZoom();

        if (currentZoom < maxZoom) {
            view.animate({ zoom: currentZoom + 1, duration: ZOOM_ANIMATION_MS });
            trackMapZoomLevel(currentZoom + 1);
        }
    }, [getActiveMap, get3d]);

    const handleZoomOut = useCallback(() => {
        const map3d = get3d();
        if (map3d) { map3d.zoomOut(); return; }
        const map = getActiveMap();
        if (!map) return;

        const view = map.getView();
        const currentZoom = view.getZoom();
        const minZoom = view.getMinZoom();

        if (currentZoom > minZoom) {
            view.animate({ zoom: currentZoom - 1, duration: ZOOM_ANIMATION_MS });
            trackMapZoomLevel(currentZoom - 1);
        }

    }, [getActiveMap, get3d]);

    const enMunicipio = !!municipioMode?.active && !!municipioMode?.scope?.type;

    const handleEncuadrar = useCallback(() => {
        const map3d = get3d();
        if (map3d) { map3d.fitBounds(JALISCO_BOUNDS.coords, { padding: 60, pitch: map3d.getPitch(), bearing: map3d.getBearing() }); return; }
        if (municipioMode?.active && municipioMode.centerOnSelection?.()) return;
        const map = getActiveMap();
        if (!map) return;
        const view = map.getView();
        const extent = transformExtent(JALISCO_BOUNDS.coords, 'EPSG:4326', 'EPSG:3857');
        const padding = getFitPadding({ mapSize: map.getSize(), siderWidth, isMobile, rightPanelWidth: ACTIVE_LAYERS_PANEL_WIDTH });
        view.fit(extent, { duration: 500, padding });
    }, [getActiveMap, siderWidth, isMobile, municipioMode, get3d]);

    const handleLocateMe = useMiUbicacion({ getActiveMap, get3d, isSwipe, mapRef, paneMapRefs, setIsLocating });

    return (
        <div
            className={`fixed bottom-15 z-10 flex flex-col items-start gap-2 ${className}`}
            style={{
                ...style,
                left: `calc(${style?.left || '0px'} + ${margenes.left}px)`,
                bottom: soloPastilla ? `calc(11.5rem + ${margenes.bottom}px)` : `calc(3.75rem + ${margenes.bottom}px)`,
            }}
        >
            <BotonNorte getActiveMap={getActiveMap} ancho={view3d.active && !soloPastilla} />
            {soloPastilla && <Map3DBar />}
            <div className={`relative flex flex-col justify-center items-center rounded-[20px] bg-white shadow-[0_5px_20px_#1A26641A] ${soloPastilla ? 'hidden' : ''}`}>
                <button
                    onClick={handleZoomIn}
                    onMouseEnter={() => setHoveredButton('zoomin')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className="p-2"
                    title="Acercar"
                    aria-label="Acercar zoom"
                >
                    <Icon
                        name="zoomin"
                        state={hoveredButton === 'zoomin' ? 'hover' : 'normal'}
                        className="w-6 h-6"
                    />
                </button>
                {!hideLocate && (
                    <button
                        onClick={handleLocateMe}
                        onMouseEnter={() => setHoveredButton('center')}
                        onMouseLeave={() => setHoveredButton(null)}
                        disabled={isLocating}
                        className="p-2"
                        title="Mi ubicación"
                        aria-label="Ir a mi ubicación"
                    >
                        <Icon
                            name="center"
                            state={isLocating || hoveredButton === 'center' ? 'hover' : 'normal'}
                            className="w-6 h-6"
                        />
                    </button>
                )}
                {!hideEncuadrar && (
                    <button
                        onClick={handleEncuadrar}
                        onMouseEnter={() => setHoveredButton('fit_extent')}
                        onMouseLeave={() => setHoveredButton(null)}
                        className="p-2"
                        title={enMunicipio ? `Encuadrar ${municipioMode.scopeLabel}` : 'Encuadrar Jalisco'}
                        aria-label={enMunicipio ? `Encuadrar la vista en ${municipioMode.scopeLabel}` : 'Encuadrar la vista en Jalisco'}
                    >
                        <Icon
                            name="fit_extent"
                            state={hoveredButton === 'fit_extent' ? 'hover' : 'normal'}
                            className="w-6 h-6"
                        />
                    </button>
                )}
                {view3d.active && (
                    <PillCloseButton
                        onClick={view3d.exit}
                        reveal="siempre"
                        tooltip="Al dar clic se cierra la vista 3D"
                        ariaLabel="Cerrar la vista 3D"
                        size="pastilla"
                        className="mx-1.5 my-0.5"
                    />
                )}
                {view3d.present && !view3d.active && !(isSwipe && isMobile) && (
                    <Tooltip content={view3d.available ? <Map3DAyuda titulo={view3dTitle} /> : view3dTitle} placement="right" interactive>
                        <button
                            type="button"
                            onClick={view3d.toggle}
                            disabled={!view3d.available}
                            aria-pressed={view3d.active}
                            className={`relative mx-1.5 my-0.5 size-8 rounded-full text-[13px] font-bold transition-colors ${view3d.available ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'} ${view3d.active ? 'bg-[#5C2472] text-white' : 'text-[#465055] hover:text-[#70308A]'}`}
                            title={view3dTitle}
                            aria-label={view3dTitle}
                        >
                        3D
                            <Badge variant="pill" color="orange" text="BETA" className="absolute -top-2 -right-3 text-[8px] px-1.5 pointer-events-none" />
                        </button>
                    </Tooltip>
                )}
                <button
                    onClick={handleZoomOut}
                    onMouseEnter={() => setHoveredButton('zoomout')}
                    onMouseLeave={() => setHoveredButton(null)}
                    className="p-2"
                    title="Alejar"
                    aria-label="Alejar zoom"
                >
                    <Icon
                        name="zoomout"
                        state={hoveredButton === 'zoomout' ? 'hover' : 'normal'}
                        className="w-6 h-6"
                    />
                </button>
                {view3d.active && !soloPastilla && (
                    <div className="absolute left-full top-0 bottom-0 ml-3">
                        <Map3DBar />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MapControls;

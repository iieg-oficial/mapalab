import { useState } from 'react';
import Tooltip from '@components/Tooltip';
import Segmented from '@components/Segmented';
import Badge from '@components/Badge';
import PanelHeader from '@components/PanelHeader';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { useGrabarVuelo } from '@hooksMaps/useGrabarVuelo';
import { useMapDownload } from '@mapsComponents/MapExport/hooks/useMapDownload';
import { puedeGrabarVideo } from '@pages/maps/helpers/grabacion/codificador';
import { reloj } from '@pages/maps/helpers/grabacion/planVuelo';
import { RADIUS_ICON } from '@pages/maps/helpers/periodicityTones';
import Map3DPopover from '../Map3D/Map3DPopover';

const CAMARAS = [
    { value: 'primera', label: '1ª persona', tooltip: 'Desde la cabina' },
    { value: 'tercera', label: '3ª persona', tooltip: 'Detrás del dron' },
    { value: 'cono', label: 'Cono', tooltip: 'La cámara del cono, mirando al suelo como un dron de mapeo' },
];

const Punto = ({ className }) => (
    <svg viewBox="0 0 20 20" className={className} aria-hidden="true">
        <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
        <circle cx="10" cy="10" r="4.5" fill="currentColor" />
    </svg>
);

const DronGrabar = ({ anchorRef, abierto, onAlternar, onCerrar }) => {
    const { layersWithLegends, selectedLayer } = useMapDownload();
    const capa = selectedLayer || layersWithLegends[0];
    const { grabando, segundos, tope, error, grabar, detener } = useGrabarVuelo({
        titulo: capa?.label || capa?.name || 'Vuelo en dron',
        totalCapas: layersWithLegends.length,
    });
    const [camara, setCamara] = useState('tercera');
    const conVideo = puedeGrabarVideo();
    const empezar = () => {
        onCerrar();
        grabar(camara);
    };

    return (
        <div className="relative">
            <Tooltip content={grabando ? 'Detener y descargar el video' : (conVideo ? 'Grabar el vuelo en video' : 'Tu navegador no puede grabar video')}>
                <button
                    type="button"
                    onClick={grabando ? detener : onAlternar}
                    disabled={!conVideo}
                    aria-pressed={grabando}
                    aria-label={grabando ? 'Detener y descargar el video' : 'Grabar el vuelo'}
                    className={`relative flex items-center justify-center size-7.5 ${RADIUS_ICON} shrink-0 transition-colors ${!conVideo ? 'opacity-40 cursor-not-allowed bg-[#F0E6F6] text-[#5C2472]' : 'cursor-pointer'} ${grabando ? 'bg-[#D6336C] text-white' : (abierto ? 'bg-[#5C2472] text-white' : 'bg-[#F0E6F6] text-[#D6336C] hover:bg-[#E2D3EA]')}`}
                >
                    <Punto className={`size-4.5 ${grabando ? 'motion-safe:animate-pulse' : ''}`} />
                    {!grabando && <Badge variant="pill" color="orange" text="BETA" className="absolute -top-2 -right-3 text-[8px] px-1.5 pointer-events-none" />}
                </button>
            </Tooltip>
            {grabando && (
                <span className="absolute left-full top-1/2 ml-2 -translate-y-1/2 flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#D6336C] px-2.5 py-1 font-garet text-[11px] font-extrabold tracking-[0.06em] text-white tabular-nums shadow-[0_2px_8px_#221A2E40]" role="status">
                    <i className="size-1.5 rounded-full bg-white motion-safe:animate-pulse" />
                    REC {reloj(segundos)} / {reloj(tope)}
                </span>
            )}
            {abierto && !grabando && (
                <Map3DPopover
                    anchorRef={anchorRef}
                    bordeRef={anchorRef}
                    onClose={onCerrar}
                    width={320}
                    alinear="abajo"
                    etiqueta="Grabar el vuelo"
                    className="rounded-[12px] bg-[#F9FBFF] px-4.5 pb-4 pt-2 shadow-[0_5px_20px_#1A26641A]"
                >
                    <PanelHeader
                        icono={<Punto className="size-4.5 text-[#D6336C]" />}
                        titulo="Grabar el vuelo"
                        acciones={<MobileSheetCloseButton onClick={onCerrar} />}
                    />
                    <div className="flex flex-col gap-3">
                        <Segmented variant="panel" ariaLabel="Cámara" options={CAMARAS} value={camara} onChange={setCamara} />
                        <button
                            type="button"
                            onClick={empezar}
                            className="w-full h-10 rounded-[30px] bg-[#D6336C] font-garet text-[14px] font-bold text-white hover:shadow-[0_6px_6px_#D6336C34] cursor-pointer"
                        >
                            Grabar hasta {reloj(tope)}
                        </button>
                        {error && <p className="font-garet text-[12px] text-[#D6336C]">{error}</p>}
                    </div>
                </Map3DPopover>
            )}
        </div>
    );
};

export default DronGrabar;

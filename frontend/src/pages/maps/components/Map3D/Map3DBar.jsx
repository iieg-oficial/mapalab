import Bar from '@components/Bar';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useView3d } from '@contexts/View3dContext';
import { trackView3d } from '@services/analyticsService';
import { VIEW3D_EXAGGERATION_RANGE, VIEW3D_PITCH_MAX } from '@pages/maps/helpers/view3d';

const ROUND_BUTTON = 'size-9 shrink-0 rounded-full bg-[#F9FBFF] grid place-items-center border border-transparent hover:border-[#70308A] transition-colors cursor-pointer';

const downloadCanvas = (map) => {
    const link = document.createElement('a');
    link.href = map.getCanvas().toDataURL('image/png');
    link.download = `mapalab-3d-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
};

const Map3DBar = () => {
    const { active, pitch, bearing, exaggeration, setPitch, setBearing, setExaggeration, map3dRef } = useView3d();
    if (!active) return null;

    const handleDownload = () => {
        const map = map3dRef.current;
        if (!map) return;
        map.once('render', () => downloadCanvas(map));
        map.triggerRepaint();
        trackView3d('download');
    };

    return (
        <div className="ml-2 flex items-center gap-3 rounded-full bg-white py-1.5 pl-1.5 pr-4 shadow-[0_5px_20px_#1A26641A]">
            <Tooltip content="Orientar al norte">
                <button type="button" className={ROUND_BUTTON} onClick={() => setBearing(0)} aria-label="Orientar al norte">
                    <svg viewBox="0 0 24 24" className="size-5" style={{ transform: `rotate(${-bearing}deg)` }} aria-hidden="true">
                        <path d="M12 3l4 9h-8z" fill="#5C2472" />
                        <path d="M12 21l-4-9h8z" fill="#C4BDCB" />
                    </svg>
                </button>
            </Tooltip>
            <label className="flex items-center gap-2 text-xs text-[#465055]">
                <span className="hidden sm:inline">Inclinación</span>
                <Bar
                    min={0}
                    max={VIEW3D_PITCH_MAX}
                    value={Math.round(pitch)}
                    onChange={(event) => setPitch(Number(event.target.value))}
                    className="w-20 sm:w-24"
                    aria-label="Inclinación"
                />
                <span className="w-7 font-medium tabular-nums text-[#1A1A1A]">{Math.round(pitch)}°</span>
            </label>
            <label className="flex items-center gap-2 text-xs text-[#465055]">
                <span className="hidden sm:inline">Relieve</span>
                <Bar
                    min={VIEW3D_EXAGGERATION_RANGE[0]}
                    max={VIEW3D_EXAGGERATION_RANGE[1]}
                    step={0.5}
                    value={exaggeration}
                    onChange={(event) => setExaggeration(Number(event.target.value))}
                    className="w-20 sm:w-24"
                    aria-label="Exageración del relieve"
                />
                <span className="w-7 font-medium tabular-nums text-[#1A1A1A]">×{exaggeration}</span>
            </label>
            <Tooltip content="Descargar imagen 3D">
                <button type="button" className={ROUND_BUTTON} onClick={handleDownload} aria-label="Descargar imagen 3D">
                    <Icon name="download" className="size-5" />
                </button>
            </Tooltip>
        </div>
    );
};

export default Map3DBar;

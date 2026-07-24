import { useEffect, useRef, useState } from 'react';
import Icon from '@components/Icon';
import Loading from '@components/Loading';
import Tooltip from '@components/Tooltip';
import { formatBytes } from '@hooksMaps/useLayerDownload';

const formatElapsed = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

const useElapsed = (running) => {
    const [elapsed, setElapsed] = useState(0);
    const startRef = useRef(0);

    useEffect(() => {
        if (!running) return;
        startRef.current = Date.now();
        setElapsed(0);
        const id = setInterval(() => setElapsed(Date.now() - startRef.current), 250);
        return () => clearInterval(id);
    }, [running]);

    return elapsed;
};

const LayerDownloadProgress = ({ open, progress, onCancel }) => {
    const loaded = progress?.loaded || 0;
    const total = progress?.total || null;
    const percent = total ? Math.min(100, Math.round((loaded / total) * 100)) : null;
    const elapsed = useElapsed(open);

    return (
        <div
            aria-hidden={!open}
            className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
        >
            <div className="overflow-hidden">
                <div className="flex items-center gap-2 bg-white rounded-[13px] shadow-[0_2px_8px_#1A26641A] px-2 py-1.5">
                    <Loading visible size="size-5" border="border-2" color="border-[#FF8300]" />

                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                        <div className="flex items-center justify-between gap-2 font-garet text-[11px] text-[#465055]">
                            <span className="flex items-center gap-1.5">
                                Descargando capa…
                                <span className="tabular-nums text-gray-400">{formatElapsed(elapsed)}</span>
                            </span>
                            <span className="tabular-nums font-bold text-[#FF8300]">
                                {percent != null
                                    ? `${percent}% · ${formatBytes(loaded)} de ${formatBytes(total)}`
                                    : formatBytes(loaded)}
                            </span>
                        </div>
                        <div className="h-1 w-full rounded-full bg-[#EFF3FC] overflow-hidden">
                            <div
                                className={`h-full rounded-full bg-[#FF8300] ${percent != null ? 'transition-[width] duration-200' : 'animate-pulse'}`}
                                style={{ width: percent != null ? `${percent}%` : '100%' }}
                            />
                        </div>
                    </div>

                    <Tooltip content="Cancelar descarga" variant="warning">
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onCancel?.(); }}
                            className="p-1 rounded-full text-gray-500 hover:text-[#FF577D] transition-colors cursor-pointer"
                        >
                            <Icon name="close" className="size-3.5" />
                        </button>
                    </Tooltip>
                </div>
            </div>
        </div>
    );
};

export default LayerDownloadProgress;

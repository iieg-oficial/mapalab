import { useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import Tooltip from '@components/Tooltip';
import Switch from '@components/Switch';

const downloadSwipeComposite = async () => {
    const target = document.querySelector('[data-swipe-composite="true"]');
    if (!target) return;
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(target, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
    });
    const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mapalab-swipe-${new Date().toISOString().slice(0, 10)}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

const SwipeSlotControls = () => {
    const { compareMode, setActiveSlot, exitCompareMode, toggleSwipeOrientation } = useMapsContext();
    const [isDownloading, setIsDownloading] = useState(false);

    if (!compareMode?.active) return null;
    const activeSlot = compareMode.activeSlot;
    const isAActive = activeSlot === 'A';
    const isHorizontal = compareMode.swipeOrientation === 'horizontal';

    const handleDownload = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            await downloadSwipeComposite();
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-[0_5px_20px_#1A26641A] border border-gray-200">
            <Switch
                checked={isAActive}
                onChange={(next) => setActiveSlot(next ? 'A' : 'B')}
                onLabel="A"
                offLabel="B"
                onColor="#5C2472"
                offColor="#FF8300"
                tooltip={`Editando ${activeSlot} — click para cambiar a ${isAActive ? 'B' : 'A'}`}
            />

            <div className="w-px h-8 bg-gray-200 mx-1" />

            <Tooltip content={isHorizontal ? 'Cambiar a barra vertical' : 'Cambiar a barra horizontal'} placement="bottom" delay={300}>
                <button
                    type="button"
                    onClick={toggleSwipeOrientation}
                    className="size-10 flex items-center justify-center rounded-full bg-[#EAEFFA] text-[#703089] hover:bg-[#703089] hover:text-white transition-all cursor-pointer"
                    aria-label={isHorizontal ? 'Cambiar a barra vertical' : 'Cambiar a barra horizontal'}
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`w-5 h-5 transition-transform ${isHorizontal ? '' : 'rotate-90'}`}>
                        <line x1="3" y1="12" x2="21" y2="12" />
                        <polyline points="7 8 3 12 7 16" />
                        <polyline points="17 8 21 12 17 16" />
                    </svg>
                </button>
            </Tooltip>

            <Tooltip content="Descargar PNG (composite con barra)" placement="bottom" delay={300}>
                <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="size-10 flex items-center justify-center rounded-full bg-[#EAEFFA] text-[#703089] hover:bg-[#703089] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                    aria-label="Descargar composite"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                </button>
            </Tooltip>

            <Tooltip content="Cerrar y volver al estado original" placement="bottom" delay={300}>
                <button
                    type="button"
                    onClick={exitCompareMode}
                    className="size-10 flex items-center justify-center rounded-full border border-transparent text-[#465055] hover:border-[#465055] active:bg-[#465055] active:text-white transition-all cursor-pointer"
                    aria-label="Cerrar comparador"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                </button>
            </Tooltip>
        </div>
    );
};

export default SwipeSlotControls;

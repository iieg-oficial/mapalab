import { useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import Tooltip from '@components/Tooltip';

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

const slotColor = {
    A: { active: 'bg-[#1D4ED8] text-white border-transparent', idle: 'bg-[#EAEFFA] text-[#1D4ED8] hover:border-[#1D4ED8]' },
    B: { active: 'bg-[#FF8300] text-white border-transparent', idle: 'bg-[#FFF1E0] text-[#B35A00] hover:border-[#FF8300]' },
};

const SwipeSlotControls = () => {
    const { compareMode, setActiveSlot, clearPaneB, exitCompareMode, discardSlot } = useMapsContext();
    const [isDownloading, setIsDownloading] = useState(false);

    if (!compareMode?.active) return null;
    const activeSlot = compareMode.activeSlot;
    const otherSlot = activeSlot === 'A' ? 'B' : 'A';

    const handleDownload = async () => {
        if (isDownloading) return;
        setIsDownloading(true);
        try {
            await downloadSwipeComposite();
        } finally {
            setIsDownloading(false);
        }
    };

    const renderSlotButton = (slot) => {
        const isActive = activeSlot === slot;
        const palette = slotColor[slot];
        return (
            <Tooltip content={isActive ? `Editando ${slot}` : `Cambiar a ${slot}`} placement="bottom" delay={300}>
                <button
                    type="button"
                    onClick={() => setActiveSlot(slot)}
                    aria-pressed={isActive}
                    className={`size-12.5 flex items-center justify-center rounded-full border transition-all font-garet text-[18px] font-bold ${isActive ? palette.active : palette.idle}`}
                >
                    {slot}
                </button>
            </Tooltip>
        );
    };

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 bg-white rounded-full shadow-[0_5px_20px_#1A26641A] border border-gray-200">
            <span className="text-[12px] font-garet text-[#465055] hidden sm:inline ml-1">Editando</span>
            {renderSlotButton('A')}
            {renderSlotButton('B')}

            <div className="w-px h-8 bg-gray-200 mx-1" />

            <Tooltip content="Vaciar slot B" placement="bottom" delay={300}>
                <button
                    type="button"
                    onClick={clearPaneB}
                    className="size-10 flex items-center justify-center rounded-full border border-transparent text-[#FF577D] hover:border-[#FF577D] active:bg-[#FF577D] active:text-white transition-all"
                    aria-label="Vaciar slot B"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                    </svg>
                </button>
            </Tooltip>

            <Tooltip content={`Descartar ${otherSlot} y conservar ${activeSlot}`} placement="bottom" delay={300}>
                <button
                    type="button"
                    onClick={() => discardSlot(otherSlot)}
                    className="px-3 h-10 flex items-center rounded-full border border-transparent text-[12px] font-garet font-medium text-[#FF577D] hover:border-[#FF577D] active:bg-[#FF577D] active:text-white transition-all"
                >
                    Descartar {otherSlot}
                </button>
            </Tooltip>

            <Tooltip content="Descargar PNG (composite con barra)" placement="bottom" delay={300}>
                <button
                    type="button"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="size-10 flex items-center justify-center rounded-full bg-[#EAEFFA] text-[#703089] hover:bg-[#703089] hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    aria-label="Descargar composite"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
                    </svg>
                </button>
            </Tooltip>

            <Tooltip content="Salir del comparador (conserva slot activo)" placement="bottom" delay={300}>
                <button
                    type="button"
                    onClick={exitCompareMode}
                    className="size-10 flex items-center justify-center rounded-full bg-[#EAEFFA] text-[#703089] hover:bg-[#703089] hover:text-white transition-all"
                    aria-label="Salir del comparador"
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

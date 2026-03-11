import { useState } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { BASEMAPS } from '@pages/maps/helpers/basemaps';

const MapAttribution = () => {
    const { baseMapId } = useMapsContext();
    const basemapConfig = BASEMAPS[baseMapId];
    const [open, setOpen] = useState(false);

    if (!basemapConfig || basemapConfig.id === 'sin_mapalab') return null;

    return (
        <div className="fixed bottom-2 right-2 z-10">
            <div className="hidden md:block rounded-[20px] bg-[#EAEFFAB2] px-3 py-1 font-[Garet,sans-serif] font-medium text-[12px] leading-[16px] tracking-[0px] text-[#6E7477] whitespace-nowrap">
                Contributors © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-[#6E7477] hover:underline hover:text-[#5C2472]">OpenStreetMap</a> | © <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer" className="text-[#6E7477] hover:underline hover:text-[#5C2472]">CARTO</a> | © <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer" className="text-[#6E7477] hover:underline hover:text-[#5C2472]">Leaflet</a> | <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="text-[#6E7477] hover:underline hover:text-[#5C2472]">CC BY 4.0</a>
            </div>

            <div className="md:hidden relative">
                {open && (
                    <div className="absolute bottom-full right-0 mb-2 rounded-[12px] bg-[#EAEFFAE6] px-3 py-2 font-[Garet,sans-serif] font-medium text-[11px] leading-[18px] text-[#6E7477] whitespace-nowrap shadow-md">
                        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="text-[#6E7477] hover:underline hover:text-[#5C2472] block">© OpenStreetMap</a>
                        <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer" className="text-[#6E7477] hover:underline hover:text-[#5C2472] block">© CARTO</a>
                        <a href="https://leafletjs.com" target="_blank" rel="noopener noreferrer" className="text-[#6E7477] hover:underline hover:text-[#5C2472] block">© Leaflet</a>
                        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer" className="text-[#6E7477] hover:underline hover:text-[#5C2472] block">CC BY 4.0</a>
                    </div>
                )}
                <button
                    onClick={() => setOpen(prev => !prev)}
                    className="w-7 h-7 rounded-full bg-[#EAEFFAB2] flex items-center justify-center font-[Garet,sans-serif] font-medium text-[16px] text-[#6E7477] shadow-sm"
                >
                    ©
                </button>
            </div>
        </div>
    );
};

export default MapAttribution;

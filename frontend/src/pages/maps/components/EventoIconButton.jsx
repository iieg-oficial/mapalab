import { useState } from 'react';
import { SIDER_TRANSITION_TIMING } from '@constants/sider';


const EventoIconButton = ({ iconUrl, title, isMenuOpen }) => {
    const [hovering, setHovering] = useState(false);
    const accent = isMenuOpen || hovering;

    return (
        <div
            className={`
                flex items-center gap-3 py-2 px-2 w-full hover:bg-black/5 transition-all duration-500 rounded-[6px]
                ${isMenuOpen ? 'bg-[#703088]/10' : ''}
            `}
            style={{ transitionTimingFunction: SIDER_TRANSITION_TIMING }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            <div
                className={`
                    shrink-0 w-[6px] h-8 rounded-[5px] transition-all duration-500
                    ${isMenuOpen ? 'bg-[#FF8300] opacity-100' : 'opacity-0'}
                `}
            />
            <div
                className={`
                    flex items-center justify-center size-8 rounded-md transition-all duration-300
                    ${isMenuOpen ? '' : '-ml-3'}
                    ${accent ? 'bg-[#5C2472]/10' : ''}
                `}
            >
                {iconUrl ? (
                    <img src={iconUrl} alt={title || 'evento'} className="size-7 object-contain" />
                ) : (
                    <span className="text-[#5C2472] font-bold text-[18px]">★</span>
                )}
            </div>
        </div>
    );
};

export default EventoIconButton;

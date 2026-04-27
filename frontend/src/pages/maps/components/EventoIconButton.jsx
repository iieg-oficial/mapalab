import { useState } from 'react';
import { SIDER_TRANSITION_TIMING } from '@constants/sider';


const EventoIconButton = ({ iconUrl, imageUrl, title, isMenuOpen, isHovered = false, compactClassName = 'size-9' }) => {
    const [hovering, setHovering] = useState(false);
    const accent = isMenuOpen || hovering;

    if (!isHovered) {
        const collapsedSrc = iconUrl || imageUrl;
        return (
            <div
                className="flex items-center justify-center w-full h-full"
                style={{ transitionTimingFunction: SIDER_TRANSITION_TIMING }}
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
            >
                <div className={`
                    flex items-center justify-center ${compactClassName} rounded-md overflow-hidden transition-opacity duration-200
                    ${accent ? 'opacity-100' : 'opacity-90 hover:opacity-100'}
                `}>
                    {collapsedSrc ? (
                        <img src={collapsedSrc} alt={title || 'evento'} className="size-full object-cover" />
                    ) : (
                        <span className="text-[#5C2472] font-bold text-[18px]">★</span>
                    )}
                </div>
            </div>
        );
    }

    const expandedSrc = imageUrl || iconUrl;
    return (
        <div
            className={`
                w-full overflow-hidden rounded-lg cursor-pointer transition-opacity duration-200
                ${isMenuOpen ? 'opacity-100' : 'opacity-90 hover:opacity-100'}
            `}
            style={{ transitionTimingFunction: SIDER_TRANSITION_TIMING }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            {expandedSrc && (
                <img
                    src={expandedSrc}
                    alt={title || 'evento'}
                    className="w-full h-auto block"
                />
            )}
        </div>
    );
};

export default EventoIconButton;

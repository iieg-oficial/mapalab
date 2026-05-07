import { useState } from 'react';
import Badge from '@components/Badge';
import { SIDER_TRANSITION_TIMING } from '@constants/sider';


const EventoIconButton = ({ iconoUrl, imagenUrl, titulo, isMenuOpen, isHovered = false, compactClassName = 'size-9' }) => {
    const [hovering, setHovering] = useState(false);
    const accent = isMenuOpen || hovering;

    if (!isHovered) {
        const collapsedSrc = iconoUrl || imagenUrl;
        return (
            <div
                className="relative flex items-center justify-center w-full h-full"
                style={{ transitionTimingFunction: SIDER_TRANSITION_TIMING }}
                onMouseEnter={() => setHovering(true)}
                onMouseLeave={() => setHovering(false)}
            >
                <div className={`
                    flex items-center justify-center ${compactClassName} rounded-md overflow-hidden transition-opacity duration-200
                    ${accent ? 'opacity-100' : 'opacity-90 hover:opacity-100'}
                `}>
                    {collapsedSrc ? (
                        <img
                            src={collapsedSrc}
                            alt={titulo || 'evento'}
                            loading="lazy"
                            decoding="async"
                            className="size-full object-cover"
                        />
                    ) : (
                        <span className="text-purple font-bold text-[18px]">★</span>
                    )}
                </div>
                <Badge
                    variant="pill"
                    color="orange"
                    text="BETA"
                    className="absolute -top-1 -right-1"
                />
            </div>
        );
    }

    const expandedSrc = imagenUrl || iconoUrl;
    return (
        <div
            className={`
                relative w-full overflow-hidden rounded-lg cursor-pointer transition-opacity duration-200
                ${isMenuOpen ? 'opacity-100' : 'opacity-90 hover:opacity-100'}
            `}
            style={{ transitionTimingFunction: SIDER_TRANSITION_TIMING }}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => setHovering(false)}
        >
            {expandedSrc && (
                <img
                    src={expandedSrc}
                    alt={titulo || 'evento'}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto block"
                />
            )}
            <Badge
                variant="pill"
                color="orange"
                text="BETA"
                className="absolute top-2 right-2"
            />
        </div>
    );
};

export default EventoIconButton;

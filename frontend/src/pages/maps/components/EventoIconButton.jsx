import { useState } from 'react';
import Badge from '@components/Badge';
import Icon from '@components/Icon';
import { SIDER_TRANSITION_TIMING } from '@constants/sider';

const SHOW_BETA_BADGE = import.meta.env.VITE_EVENTOS_BETA_BADGE !== 'false';

const FallbackIcon = ({ sizeClass = 'w-5 h-5' }) => (
    <Icon name="pin_fallback" className={`${sizeClass} text-purple`} />
);

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
                        <FallbackIcon sizeClass="w-5 h-5" />
                    )}
                </div>
                {SHOW_BETA_BADGE && (
                    <Badge variant="pill" color="orange" text="BETA" className="absolute -top-1 -right-1" />
                )}
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
            {expandedSrc ? (
                <img
                    src={expandedSrc}
                    alt={titulo || 'evento'}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto block"
                />
            ) : (
                <div className="flex items-center justify-center w-full py-6 bg-gray-50">
                    <FallbackIcon sizeClass="w-8 h-8" />
                </div>
            )}
            {SHOW_BETA_BADGE && (
                <Badge variant="pill" color="orange" text="BETA" className="absolute top-2 right-2" />
            )}
        </div>
    );
};

export default EventoIconButton;

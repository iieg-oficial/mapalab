import { cloneElement } from 'react';
import { externalIcons } from '@assets/icons';

const colibriIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M16 7h.01" />
        <path d="M3.4 18H12a8 8 0 0 0 8-8V7a4 4 0 0 0-7.28-2.3L2 20" />
        <path d="m20 7 2 .5-2 .5" />
        <path d="M10 18v3" />
        <path d="M14 17.75V21" />
        <path d="M7 18a6 6 0 0 0 3.84-10.61" />
    </svg>
);

const icons = {
    download: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
        </svg>
    ),
    undo: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 5 4 10 9 15" />
            <path d="M4 10h8a6 6 0 1 1 0 12H9" />
        </svg>
    ),
    recorte: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 8V5a1 1 0 0 1 1-1h3" />
            <path d="M16 4h3a1 1 0 0 1 1 1v3" />
            <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
            <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
    ),
    columnas: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="4.5" height="16" rx="1" />
            <rect x="9.75" y="4" width="4.5" height="16" rx="1" />
            <rect x="16.5" y="4" width="4.5" height="16" rx="1" />
        </svg>
    ),
    filtro: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 5h16l-6 7v6l-4 2v-8z" />
        </svg>
    ),
    tabla: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="14.5" x2="21" y2="14.5" />
            <line x1="9.5" y1="9" x2="9.5" y2="20" />
            <line x1="15.5" y1="9" x2="15.5" y2="20" />
        </svg>
    ),
    close: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    ),
    done: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    ),
    pencil: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
    ),
    text: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 7V4h16v3" />
            <path d="M9 20h6" />
            <path d="M12 4v16" />
        </svg>
    ),
    opacity: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2 A10 10 0 0 1 12 22 Z" fill="currentColor" stroke="none" />
        </svg>
    ),
    alert_triangle: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
    ),
    bug: colibriIcon,
    tool_swipe: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="12" width="48" height="36" rx="2" />
            <line x1="30" y1="8" x2="30" y2="52" strokeWidth="3" stroke="#FF8300" />
            <path d="M22 30l-4-4M22 30l-4 4M38 30l4-4M38 30l4 4" stroke="#FF8300" />
        </svg>
    ),
    pin_fallback: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    ),
    pause_all: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 14" fill="currentColor">
            <rect x="1" y="1" width="3" height="12" rx="1" />
            <rect x="8" y="1" width="3" height="12" rx="1" />
        </svg>
    ),
    chevron: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 13.171 7.05" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" aria-hidden="true">
            <path d="M1.409 1.409 6.6 5.746l5.163-4.337" />
        </svg>
    ),
    play: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
            <path d="M11 6.13 1.5.63A1 1 0 0 0 0 1.5v11a1 1 0 0 0 1.5.87l9.5-5.5a1 1 0 0 0 0-1.74Z" />
        </svg>
    ),
    pause: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 14" fill="currentColor" aria-hidden="true">
            <rect x="1" y="1" width="3.5" height="12" rx="1.2" />
            <rect x="7.5" y="1" width="3.5" height="12" rx="1.2" />
        </svg>
    ),
    swipe_handle_chevrons_h: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 3 18 9" />
            <polyline points="18 15 12 21 6 15" />
        </svg>
    ),
    swipe_handle_chevrons_v: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 3 12 9 6" />
            <polyline points="15 6 21 12 15 18" />
        </svg>
    ),
    swipe_orientacion: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <polyline points="7 8 3 12 7 16" />
            <polyline points="17 8 21 12 17 16" />
        </svg>
    ),
    center_group: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
        </svg>
    ),
    move_arrows: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="5 9 2 12 5 15" />
            <polyline points="9 5 12 2 15 5" />
            <polyline points="15 19 12 22 9 19" />
            <polyline points="19 9 22 12 19 15" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <line x1="12" y1="2" x2="12" y2="22" />
        </svg>
    ),
    settings: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
    ),
    geom_point: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none">
            <circle cx="12" cy="5.5" r="1.9" />
            <circle cx="18.5" cy="16.5" r="1.9" />
            <circle cx="5.5" cy="16.5" r="1.9" />
        </svg>
    ),
    geom_line: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 18 9.5 9 15 14l5-9" />
            <circle cx="4" cy="18" r="1.8" fill="currentColor" stroke="none" />
            <circle cx="20" cy="5" r="1.8" fill="currentColor" stroke="none" />
        </svg>
    ),
    geom_polygon: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
            <path d="M12 4 20.5 18.5H3.5z" fill="currentColor" fillOpacity="0.18" />
            <circle cx="12" cy="4" r="1.6" fill="currentColor" stroke="none" />
            <circle cx="20.5" cy="18.5" r="1.6" fill="currentColor" stroke="none" />
            <circle cx="3.5" cy="18.5" r="1.6" fill="currentColor" stroke="none" />
        </svg>
    ),
    solo_capa: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" strokeLinecap="round">
            <path d="M12 3 20.5 7.5 12 12 3.5 7.5z" fill="currentColor" stroke="none" />
            <path d="M4.5 12.5 12 16.3l7.5-3.8" opacity="0.45" />
            <path d="M4.5 17 12 20.8l7.5-3.8" opacity="0.22" />
        </svg>
    ),
    crear: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14" />
            <path d="M5 12h14" />
        </svg>
    ),
    ranking: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 20V4l-3 3" />
            <path d="M12 6h9" />
            <path d="M12 12h6" />
            <path d="M12 18h3" />
        </svg>
    ),
    grafica: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4v15a1 1 0 0 0 1 1h15" />
            <path d="M7 15l4-5 3 3 5-6" />
        </svg>
    ),
    comparar: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 8h15l-3.5-3.5" />
            <path d="M21 16H6l3.5 3.5" />
        </svg>
    ),
    numeralia: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="13" width="4.5" height="7" rx="1" />
            <rect x="9.75" y="8" width="4.5" height="12" rx="1" />
            <rect x="16.5" y="4" width="4.5" height="16" rx="1" />
        </svg>
    ),
    geom_hexbin: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
            <path d="M12 3 19 7v10l-7 4-7-4V7z" fill="currentColor" fillOpacity="0.32" />
            <path d="M12 8.5 15.5 10.5v4L12 16.5 8.5 14.5v-4z" fill="currentColor" fillOpacity="0.55" stroke="none" />
        </svg>
    ),
    cubo: (<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round">
        <path d="M12 3 20 7.5v9L12 21l-8-4.5v-9z" /><path d="M4 7.5 12 12l8-4.5M12 12v9" /></svg>),
    geom_raster: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="1.5" />
            <path d="M12 4v16M4 12h16" />
            <rect x="4" y="4" width="8" height="8" fill="currentColor" fillOpacity="0.18" stroke="none" />
            <rect x="12" y="12" width="8" height="8" fill="currentColor" fillOpacity="0.18" stroke="none" />
        </svg>
    ),
    desacoplar: (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="4" y="4" width="16" height="16" rx="2.5" />
            <path d="M12 8v6.5" />
            <path d="m9 11.5 3 3 3-3" />
        </svg>
    ),
};

const Icon = ({ name, className = '', classNameBG = '', state = 'normal', visible = true, title = null, onClick = null }) => {
    if (!visible) return null;

    const positioningClasses = ['absolute', 'fixed', 'relative', 'sticky', 'top-', 'bottom-', 'left-', 'right-', 'inset-', 'z-'];
    const classNames = className.split(' ');
    const wrapperClasses = [];
    const iconClasses = [];

    classNames.forEach(cls => {
        if (positioningClasses.some(pos => cls.startsWith(pos))) {
            wrapperClasses.push(cls);
        } else {
            iconClasses.push(cls);
        }
    });

    const externalKey = `${name}_${state}`;
    let iconElement = null;
    const iconClassName = iconClasses.join(' ');

    if (externalIcons[externalKey]) {
        iconElement = <img src={externalIcons[externalKey]} alt={name} className={iconClassName || 'w-[29px] h-[29px]'} />;
    } else if (icons[name]) {
        const icon = icons[name];
        const mergedClassName = iconClassName || icon.props.className;
        iconElement = cloneElement(icon, { className: mergedClassName });
    }

    if (!iconElement) return null;

    const needsWrapper = onClick || title || wrapperClasses.length > 0 || classNameBG;

    if (needsWrapper) {
        const finalWrapperClasses = [
            ...wrapperClasses,
            classNameBG,
            onClick ? 'cursor-pointer' : ''
        ].filter(Boolean).join(' ');

        const content = iconElement;
        iconElement = onClick ? (
            <button type="button" onClick={onClick} title={title || undefined} className={finalWrapperClasses || undefined}>
                {content}
            </button>
        ) : (
            <span title={title || undefined} className={finalWrapperClasses || undefined}>
                {content}
            </span>
        );
        return iconElement;
    }

    return iconElement;
};

export default Icon;


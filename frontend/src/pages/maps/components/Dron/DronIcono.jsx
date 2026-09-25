const TRAZOS = {
    cuadri: (
        <>
            <path d="M7 7l3 3M17 7l-3 3M7 17l3-3M17 17l-3-3" />
            <circle cx="5" cy="5" r="2.8" /><circle cx="19" cy="5" r="2.8" /><circle cx="5" cy="19" r="2.8" /><circle cx="19" cy="19" r="2.8" />
            <rect x="9.6" y="9.6" width="4.8" height="4.8" rx="1.2" fill="currentColor" />
        </>
    ),
    hexa: (
        <>
            <path d="M12 5v4M12 15v4M6 8.5l3.3 2M14.7 13.5l3.3 2M6 15.5l3.3-2M14.7 10.5l3.3-2" />
            <circle cx="12" cy="3.5" r="2" /><circle cx="12" cy="20.5" r="2" /><circle cx="4.5" cy="7.7" r="2" />
            <circle cx="19.5" cy="7.7" r="2" /><circle cx="4.5" cy="16.3" r="2" /><circle cx="19.5" cy="16.3" r="2" />
            <path d="M12 9.3l2.4 1.35v2.7L12 14.7l-2.4-1.35v-2.7z" fill="currentColor" />
        </>
    ),
    ala: (
        <>
            <path d="M12 4L2 15l1 2 9-4 9 4 1-2z" fill="currentColor" fillOpacity="0.18" />
            <path d="M12 4L2 15l1 2 9-4 9 4 1-2z" />
            <path d="M12 13v6M10 19h4" />
        </>
    ),
    vtol: (
        <>
            <path d="M12 3v18M3 11h18M9 20h6" />
            <circle cx="6" cy="6.5" r="2.2" /><circle cx="18" cy="6.5" r="2.2" /><circle cx="6" cy="15.5" r="2.2" /><circle cx="18" cy="15.5" r="2.2" />
        </>
    ),
    fpv: (
        <>
            <circle cx="6" cy="6" r="3.6" /><circle cx="18" cy="6" r="3.6" /><circle cx="6" cy="18" r="3.6" /><circle cx="18" cy="18" r="3.6" />
            <path d="M8.5 8.5l7 7M15.5 8.5l-7 7" />
            <circle cx="12" cy="12" r="1.8" fill="currentColor" />
        </>
    ),
    heli: (
        <>
            <path d="M3 5h18M12 5v3" />
            <path d="M5 12.5c0-2.5 2.5-4.5 6-4.5 3 0 5 2 5 4.5S14 17 11 17c-3.5 0-6-2-6-4.5z" />
            <path d="M16 12.5h5l1-2.5M7 20h9M9 17v3M14 17v3" />
        </>
    ),
    globo: (
        <>
            <path d="M12 2.5c4 0 7 3 7 7 0 3.5-3.5 7-5.5 8.5h-3C8.5 16.5 5 13 5 9.5c0-4 3-7 7-7z" />
            <path d="M12 2.5c-2 1.5-3 4-3 7s1.5 6 2 8.5M12 2.5c2 1.5 3 4 3 7s-1.5 6-2 8.5" />
            <rect x="10" y="19.5" width="4" height="2.5" rx="0.5" fill="currentColor" />
        </>
    ),
    teclas: (
        <>
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
        </>
    ),
    relieve: <path d="M2 20l6.5-10 4 6 3-4.5L22 20z" fill="currentColor" />,
    altura: (
        <>
            <path d="M12 3v14M8.5 6.5L12 3l3.5 3.5M8.5 13.5L12 17l3.5-3.5" />
            <path d="M3 21h18" />
        </>
    ),
    velocidad: (
        <>
            <path d="M4 18a8 8 0 1116 0" />
            <path d="M12 18l4.5-5.5" />
        </>
    ),
    camara: (
        <>
            <rect x="2" y="7" width="13" height="10" rx="2" />
            <path d="M15 10.5l6-3.5v10l-6-3.5z" />
        </>
    ),
    horizonte: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M3 13l18-3M8 16h8" />
        </>
    ),
    vario: <path d="M12 4v16M7 9l5-5 5 5M7 15l5 5 5-5" />,
};

const DronIcono = ({ nombre, className = 'size-5' }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`shrink-0 ${className}`}
        aria-hidden="true"
    >
        {TRAZOS[nombre]}
    </svg>
);

export default DronIcono;

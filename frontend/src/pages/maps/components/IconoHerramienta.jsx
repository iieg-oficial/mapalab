const MORADO = 'var(--color-purple)';
const NARANJA = 'var(--color-orange)';

const trazo = { fill: 'none', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' };

const JALISCO = 'M6.0 28.2 L9.8 26.2 L12.4 23.8 L15.8 22.3 L17.5 18.6 L18.8 15.5 L17.5 12.6 L20.1 9.3 L22.7 6.5 L25.2 8.4 L24.0 12.4 L26.1 15.5 L29.5 14.0 L31.7 13.0 L36.0 10.7 L39.0 13.5 L42.0 15.8 L41.0 19.5 L37.3 22.3 L34.7 26.2 L32.4 30.8 L29.1 33.5 L27.2 36.9 L25.0 39.7 L22.4 41.5 L17.9 39.9 L14.5 38.7 L11.5 35.9 L8.9 32.3 L6.8 30.1 Z';

const DIBUJOS = {
    mediciones: (
        <>
            <g transform="rotate(-45 24 24)">
                <rect x="5" y="19" width="38" height="10" rx="2" stroke={MORADO} {...trazo} />
                <path d="M11 19v4M17 19v5.5M23 19v4M29 19v5.5M35 19v4" stroke={MORADO} {...trazo} />
            </g>
            <path d="M42 30v12H30z" stroke={NARANJA} {...trazo} />
        </>
    ),
    'compare-swipe': (
        <>
            <rect x="5" y="10" width="38" height="28" rx="2" stroke={MORADO} {...trazo} />
            <path d="M24 6v36M18 24l-3.5-3.5M18 24l-3.5 3.5M30 24l3.5-3.5M30 24l3.5 3.5" stroke={NARANJA} {...trazo} />
        </>
    ),
    tabla: (
        <>
            <path d="M9 9h30a3 3 0 0 1 3 3v5H6v-5a3 3 0 0 1 3-3z" fill={NARANJA} stroke={NARANJA} strokeWidth="2.5" strokeLinejoin="round" />
            <rect x="6" y="9" width="36" height="30" rx="3" stroke={MORADO} {...trazo} />
            <path d="M6 28h36M18 17v22M30 17v22" stroke={MORADO} {...trazo} />
        </>
    ),
    anotaciones: (
        <>
            <circle cx="24" cy="24" r="17" stroke={MORADO} {...trazo} />
            <circle cx="18" cy="20" r="2" fill={MORADO} />
            <circle cx="30" cy="20" r="2" fill={MORADO} />
            <path d="M16 28q8 8 16 0" stroke={NARANJA} {...trazo} />
        </>
    ),
    catalogo: (
        <>
            <path d="M8 24l16 8 16-8M8 32l16 8 16-8" stroke={MORADO} {...trazo} />
            <path d="M24 8l16 8-16 8-16-8z" stroke={NARANJA} {...trazo} />
        </>
    ),
    minimapa: (
        <>
            <path d={JALISCO} stroke={MORADO} {...trazo} strokeWidth="2" />
            <rect x="21" y="21.5" width="10" height="8" rx="1" stroke={NARANJA} {...trazo} />
        </>
    ),
};

const IconoHerramienta = ({ id, className = 'w-12 h-12' }) => {
    const dibujo = DIBUJOS[id];
    if (!dibujo) return null;
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className} aria-hidden="true">
            {dibujo}
        </svg>
    );
};

export default IconoHerramienta;

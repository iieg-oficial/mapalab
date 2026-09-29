const MORADO = 'var(--color-purple)';
const NARANJA = 'var(--color-orange)';

const trazo = { fill: 'none', strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round' };

const JALISCO = 'M16.5 39.9 L15.5 41.5 L10.9 39.4 L4.0 28.6 L7.6 27.6 L9.2 23.8 L12.1 22.4 L17.3 25.8 L17.8 20.8 L20.3 18.8 L18.0 17.2 L18.5 14.4 L16.5 11.9 L17.0 10.1 L20.8 8.3 L20.1 4.8 L22.4 5.1 L21.5 10.8 L22.6 6.6 L23.9 7.1 L23.1 11.4 L25.2 11.5 L26.2 7.2 L29.1 9.8 L28.2 12.9 L25.5 13.6 L24.5 17.0 L22.8 17.3 L22.0 20.7 L28.8 22.0 L28.9 19.9 L32.8 18.9 L32.3 15.0 L36.6 16.1 L40.3 12.1 L44.0 13.6 L42.2 17.1 L43.2 19.2 L38.3 24.5 L39.4 26.7 L38.0 28.8 L32.3 30.7 L31.5 29.5 L25.6 29.9 L30.2 31.0 L29.0 32.9 L31.6 33.1 L32.0 37.7 L34.3 38.2 L32.7 40.6 L24.8 43.2 L23.7 37.8 Z';

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
            <path d="M6 17h36M6 28h36M18 17v22M30 17v22" stroke={MORADO} {...trazo} />
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
            <path d="M24 17.5l16 10.5-16 10.5L8 28z" stroke={MORADO} {...trazo} />
            <path d="M24 7l16 10.5L24 28 8 17.5z" stroke={NARANJA} {...trazo} />
        </>
    ),
    minimapa: (
        <>
            <path d={JALISCO} stroke={MORADO} {...trazo} strokeWidth="2" />
            <rect x="22.2" y="23.0" width="8" height="6" rx="1" stroke={NARANJA} {...trazo} />
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

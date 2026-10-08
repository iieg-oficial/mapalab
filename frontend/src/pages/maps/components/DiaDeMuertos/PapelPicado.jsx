import { useId } from 'react';

const PUNTOS = [6, 12, 18, 24, 30, 36, 42];
const PETALOS = [0, 45, 90, 135];
const CONTORNO = 'M0 0 H48 V52 L44 57 L40 52 L36 57 L32 52 L28 57 L24 52 L20 57 L16 52 L12 57 L8 52 L4 57 L0 52 Z';

const PapelPicado = ({ color, className = '' }) => {
    const id = `picado-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
    return (
        <svg viewBox="0 0 48 60" className={className} aria-hidden="true">
            <mask id={id}>
                <rect width="48" height="60" fill="#FFFFFF" />
                <g fill="#000000">
                    {PUNTOS.map((x) => <circle key={`a${x}`} cx={x} cy="6" r="1.4" />)}
                    {PUNTOS.map((x) => <circle key={`b${x}`} cx={x} cy="46" r="1.4" />)}
                    {PETALOS.map((a) => <ellipse key={a} cx="24" cy="26" rx="3" ry="8" transform={`rotate(${a} 24 26)`} />)}
                    <path d="M9 26 L12 21 L15 26 L12 31 Z" />
                    <path d="M33 26 L36 21 L39 26 L36 31 Z" />
                    <path d="M8 13 Q24 20 40 13 L40 15 Q24 22 8 15 Z" />
                    <path d="M8 39 Q24 32 40 39 L40 37 Q24 30 8 37 Z" />
                </g>
                <circle cx="24" cy="26" r="2.2" fill="#FFFFFF" />
            </mask>
            <path d={CONTORNO} fill={color} mask={`url(#${id})`} />
        </svg>
    );
};

export default PapelPicado;

const LLAMA = 'M0 -14 C4 -9 4.5 -4 3 -1 C2 1 -2 1 -3 -1 C-4.5 -4 -4 -9 0 -14 Z';
const NUCLEO = 'M0 -9 C2 -6 2.4 -3 1.5 -1.2 C0.8 0 -0.8 0 -1.5 -1.2 C-2.4 -3 -2 -6 0 -9 Z';
const AZUCAR = [[20, 17], [38, 16], [26, 22], [35, 23], [44, 27], [17, 27], [30, 16]];
const MECHA = '#3A2A1E';

export const Llama = ({ x, y, escala, retraso }) => {
    const ritmo = { animationDelay: `-${retraso}s` };
    return (
        <g transform={`translate(${x} ${y}) scale(${escala})`}>
            <circle className="muertos-halo" cx="0" cy="-6" r="9" fill="#FFC857" opacity="0.28" style={ritmo} />
            <g className="muertos-llama" style={ritmo}>
                <path d={LLAMA} fill="#F28C0F" />
                <path d={NUCLEO} fill="#FFE27A" />
            </g>
        </g>
    );
};

export const Cirio = ({ x, base, alto, ancho = 6, retraso = 0 }) => {
    const top = base - alto;
    return (
        <g>
            <rect x={x - ancho / 2} y={top} width={ancho} height={alto} rx="1.3" fill="#FFF8EC" stroke="#E5D6BE" strokeWidth="0.7" />
            <path d={`M${x - ancho / 2} ${top + 2} q1.3 4 0 7`} stroke="#EADBC3" strokeWidth="1.4" fill="none" strokeLinecap="round" />
            <path d={`M${x} ${top} V${top - 2}`} stroke={MECHA} strokeWidth="0.8" />
            <Llama x={x} y={top - 1.6} escala={0.62} retraso={retraso} />
        </g>
    );
};

export const Veladora = ({ x, base, ancho = 9, alto = 12, retraso = 0 }) => {
    const top = base - alto;
    return (
        <g>
            <rect x={x - ancho / 2} y={top} width={ancho} height={alto} rx="1.6" fill="#F6E7C8" stroke="#D9B98A" strokeWidth="0.7" />
            <rect x={x - ancho / 2 + 1.2} y={top + 2.4} width={ancho - 2.4} height={alto - 3.6} rx="1" fill="#E9446A" opacity="0.85" />
            <path d={`M${x} ${top + 2} V${top + 0.6}`} stroke={MECHA} strokeWidth="0.8" />
            <Llama x={x} y={top + 1} escala={0.5} retraso={retraso} />
        </g>
    );
};

export const PanLado = ({ x, base, ancho }) => {
    const alto = ancho * 0.66;
    return (
        <svg x={x - ancho / 2} y={base - alto + 1} width={ancho} height={alto} viewBox="0 0 60 40">
            <ellipse cx="30" cy="37" rx="27" ry="3" fill="#8A5A2B" opacity="0.35" />
            <path d="M4 36 Q4 8 30 8 Q56 8 56 36 Z" fill="#D9953F" />
            <path d="M4 36 Q4 26 8 20 Q20 30 30 30 Q40 30 52 20 Q56 26 56 36 Z" fill="#C77F2E" />
            <g stroke="#B5682A" strokeWidth="3.6" strokeLinecap="round" fill="none">
                <path d="M12 30 Q22 12 30 10" />
                <path d="M48 30 Q38 12 30 10" />
                <path d="M14 22 Q30 28 46 22" />
            </g>
            <g fill="#B5682A">
                <circle cx="12" cy="30" r="2.6" />
                <circle cx="48" cy="30" r="2.6" />
                <circle cx="14" cy="22" r="2.6" />
                <circle cx="46" cy="22" r="2.6" />
            </g>
            <circle cx="30" cy="9" r="4.6" fill="#C9772C" />
            <g fill="#FFF6E5" opacity="0.8">
                {AZUCAR.map(([cx, cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="0.9" />)}
            </g>
        </svg>
    );
};

export const Jarrito = ({ x, base, ancho }) => {
    const top = base - ancho * 0.95;
    const mitad = ancho / 2;
    return (
        <g>
            <path d={`M${x + mitad - 1} ${top + 3} q4 1 3.4 4.6 q-0.6 3 -3.6 2.6`} stroke="#8E4020" strokeWidth="1.6" fill="none" />
            <path d={`M${x - mitad} ${top + 1} Q${x - mitad - 1} ${base - 2} ${x - mitad + 2} ${base} H${x + mitad - 2} Q${x + mitad + 1} ${base - 2} ${x + mitad} ${top + 1} Z`} fill="#B5562F" />
            <rect x={x - mitad - 0.6} y={top} width={ancho + 1.2} height="2.2" rx="1" fill="#C8693D" />
            <path d={`M${x - mitad + 1.5} ${top + 5} H${x + mitad - 1.5}`} stroke="#F5B700" strokeWidth="0.9" />
            <ellipse cx={x} cy={top + 1} rx={mitad - 1.4} ry="0.9" fill="#3B2414" />
            <g fill="none" stroke="#BFC5C9" strokeWidth="0.9" strokeLinecap="round">
                <path className="muertos-vapor" d={`M${x - 2} ${top - 1} q-2 -3 0 -6 q2 -3 0 -6`} />
                <path className="muertos-vapor" style={{ animationDelay: '-1.3s' }} d={`M${x + 2} ${top - 1} q2 -3 0 -6 q-2 -3 0 -6`} />
            </g>
        </g>
    );
};

export const Mazapan = ({ x, base, ancho }) => {
    const alto = ancho * 0.5;
    return (
        <g>
            <rect x={x - ancho / 2} y={base - alto} width={ancho} height={alto} rx="1.5" fill="#E8C9A0" />
            <rect x={x - ancho / 2} y={base - alto * 0.55} width={ancho} height={alto * 0.55} rx="1" fill="#D81B3C" />
            <path d={`M${x - ancho / 2 + 1} ${base - alto * 0.3} H${x + ancho / 2 - 1}`} stroke="#FFFFFF" strokeWidth="0.7" strokeDasharray="1.2 1" />
        </g>
    );
};

export const Cocada = ({ x, base, ancho }) => (
    <g>
        <path d={`M${x - ancho / 2} ${base} Q${x - ancho / 2} ${base - ancho * 0.7} ${x} ${base - ancho * 0.8} Q${x + ancho / 2} ${base - ancho * 0.7} ${x + ancho / 2} ${base} Z`} fill="#F2E2C4" />
        <path d={`M${x - ancho / 3} ${base - ancho * 0.55} Q${x} ${base - ancho * 0.85} ${x + ancho / 3} ${base - ancho * 0.55}`} stroke="#C98B4A" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </g>
);

export const Calabaza = ({ x, base, ancho }) => (
    <g>
        <path d={`M${x - ancho / 2} ${base} L${x - ancho / 2 + 1} ${base - ancho * 0.5} Q${x} ${base - ancho * 0.75} ${x + ancho / 2 - 1} ${base - ancho * 0.5} L${x + ancho / 2} ${base} Z`} fill="#D9661B" />
        <path d={`M${x - ancho / 4} ${base - ancho * 0.45} q2 -1 4 0`} stroke="#F7B267" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </g>
);

export const Mandarina = ({ x, base, radio }) => {
    const cy = base - radio;
    return (
        <g>
            <circle cx={x} cy={cy} r={radio} fill="#F28C0F" />
            <circle cx={x - radio * 0.35} cy={cy - radio * 0.35} r={radio * 0.3} fill="#F7B267" />
            <path d={`M${x} ${cy - radio} l1.6 -1.4`} stroke="#3F6B2F" strokeWidth="1" />
        </g>
    );
};

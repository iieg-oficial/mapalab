const HOJA = 'M0 0 C6 -5 15 -5 22 0 C15 5 6 5 0 0 Z';

const RamaSvg = ({ ramo }) => (
    <svg
        viewBox={`0 0 ${ramo.ancho} ${ramo.alto}`}
        width={ramo.ancho}
        height={ramo.alto}
        className="absolute inset-0 overflow-visible"
        aria-hidden="true"
    >
        {ramo.ramas.map(({ d, stroke, width, brillo }) => (
            <g key={d} fill="none" strokeLinecap="round">
                <path d={d} stroke={stroke} strokeWidth={width} />
                {brillo && <path d={d} stroke="#8DB46B" strokeWidth="0.9" transform="translate(0 -0.9)" />}
            </g>
        ))}
        <g stroke="#5E8A44" strokeWidth="1.1" fill="none" strokeLinecap="round">
            {ramo.zarcillos.map((d) => <path key={d} d={d} />)}
        </g>
        {ramo.hojas.map(({ x, y, r, w }) => (
            <g key={`${x}-${y}`} transform={`translate(${x} ${y}) rotate(${r}) scale(${w / 22})`}>
                <path d={HOJA} fill="#5E8A44" />
                <path d="M2 0 H19" stroke="#3F6B2F" strokeWidth="0.8" />
            </g>
        ))}
        <g stroke="#5E8A44" strokeWidth="1.4" fill="none" strokeLinecap="round">
            {ramo.tallos.map((d) => <path key={d} d={d} />)}
        </g>
    </svg>
);

export default RamaSvg;

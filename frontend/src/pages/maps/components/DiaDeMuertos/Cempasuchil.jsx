const ANILLOS = [
    { fill: '#E06A0A', cy: -11, rx: 5, ry: 8.5, angulos: Array.from({ length: 12 }, (_, i) => i * 30) },
    { fill: '#F28C0F', cy: -7.5, rx: 4.5, ry: 6.5, angulos: Array.from({ length: 10 }, (_, i) => 18 + i * 36) },
    { fill: '#FAB12F', cy: -4, rx: 3.5, ry: 4.5, angulos: Array.from({ length: 8 }, (_, i) => i * 45) },
];

const Cempasuchil = ({ className = '', style }) => (
    <svg viewBox="-20 -20 40 40" className={className} style={style} aria-hidden="true">
        {ANILLOS.map(({ fill, cy, rx, ry, angulos }) => (
            <g key={fill} fill={fill}>
                {angulos.map((a) => <ellipse key={a} cx="0" cy={cy} rx={rx} ry={ry} transform={`rotate(${a})`} />)}
            </g>
        ))}
        <circle r="2.6" fill="#C9560A" />
    </svg>
);

export default Cempasuchil;

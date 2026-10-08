const ROJO = { cuerpo: '#D81B3C', borde: '#A3102B' };
const BLANCO = { cuerpo: '#FFFFFF', borde: '#E6E1DC' };

const polar = (grados, radio) => {
    const rad = ((grados - 90) * Math.PI) / 180;
    return { x: radio * Math.cos(rad), y: radio * Math.sin(rad) };
};

const LOBULOS = [0, 72, 144, 216, 288].map((a) => ({ a, ...polar(a, 8.5) }));
const VENAS = [36, 108, 180, 252, 324].map((a) => ({ a, ...polar(a, 15) }));

const Maravilla = ({ variante = 'rbrbb', className = '' }) => {
    const colores = [...variante].map((c) => (c === 'r' ? ROJO : BLANCO));
    return (
        <svg viewBox="-20 -20 40 40" className={className} aria-hidden="true">
            {LOBULOS.map(({ a, x, y }, i) => <circle key={`b${a}`} cx={x} cy={y} r="8.6" fill={colores[i].borde} />)}
            <g transform="scale(0.9)">
                {LOBULOS.map(({ a, x, y }, i) => <circle key={`c${a}`} cx={x} cy={y} r="8.6" fill={colores[i].cuerpo} />)}
            </g>
            <g stroke="#00000022" strokeWidth="0.7">
                {VENAS.map(({ a, x, y }) => <path key={a} d={`M0 0 L${x} ${y}`} />)}
            </g>
        </svg>
    );
};

export default Maravilla;

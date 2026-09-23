import { useMemo, useRef, useState } from 'react';
import { formatLengthValue } from '@pages/maps/helpers/formatMeasure';
import { formatNumber } from '@pages/maps/helpers/formatNumber';

const ANCHO = 276;
const ALTO = 118;
const MARGEN = { izq: 44, der: 6, arr: 8, aba: 18 };

const marcas = (min, max, cuantas) => {
    const rango = max - min || 1;
    const paso = 10 ** Math.floor(Math.log10(rango / cuantas));
    const salto = paso * ([1, 2, 2.5, 5, 10].find(f => rango / (paso * f) <= cuantas) || 10);
    const lista = [];
    for (let v = Math.ceil(min / salto) * salto; v <= max + 1e-9; v += salto) lista.push(v);
    return lista;
};

const metros = (valor) => `${formatNumber(Math.round(valor))} m`;

const PerfilElevacion = ({ perfil, onRecorrer }) => {
    const svgRef = useRef(null);
    const [activo, setActivo] = useState(null);

    const escala = useMemo(() => {
        const total = perfil[perfil.length - 1].metros || 1;
        const alts = perfil.map(p => p.alt);
        const ticksY = marcas(Math.min(...alts), Math.max(...alts), 3);
        const yMin = Math.min(ticksY[0], ...alts);
        const yMax = Math.max(ticksY[ticksY.length - 1], ...alts);
        const x = (m) => MARGEN.izq + (m / total) * (ANCHO - MARGEN.izq - MARGEN.der);
        const y = (a) => ALTO - MARGEN.aba - ((a - yMin) / (yMax - yMin || 1)) * (ALTO - MARGEN.arr - MARGEN.aba);
        const linea = perfil.map((p, i) => `${i ? 'L' : 'M'}${x(p.metros).toFixed(1)},${y(p.alt).toFixed(1)}`).join('');
        return {
            total, x, y, ticksY, ticksX: marcas(0, total, 5), linea,
            area: `${linea}L${x(total).toFixed(1)},${ALTO - MARGEN.aba}L${x(0)},${ALTO - MARGEN.aba}Z`,
        };
    }, [perfil]);

    const mover = (event) => {
        const rect = svgRef.current.getBoundingClientRect();
        const xv = ((event.clientX - rect.left) / rect.width) * ANCHO;
        const m = Math.max(0, Math.min(escala.total, ((xv - MARGEN.izq) / (ANCHO - MARGEN.izq - MARGEN.der)) * escala.total));
        const punto = perfil.reduce((mejor, p) => (Math.abs(p.metros - m) < Math.abs(mejor.metros - m) ? p : mejor), perfil[0]);
        setActivo(punto);
        onRecorrer(punto.lngLat);
    };
    const salir = () => { setActivo(null); onRecorrer(null); };

    return (
        <div className="relative">
            <svg ref={svgRef} viewBox={`0 0 ${ANCHO} ${ALTO}`} className="block w-full h-auto" role="img" aria-label="Perfil de elevación de la línea medida">
                {escala.ticksY.map(t => (
                    <g key={`y${t}`}>
                        <line x1={MARGEN.izq} x2={ANCHO - MARGEN.der} y1={escala.y(t)} y2={escala.y(t)} stroke="#EEEBF2" />
                        <text x={MARGEN.izq - 6} y={escala.y(t) + 4} textAnchor="end" className="fill-[#7B8388] font-garet text-[9px]">{metros(t)}</text>
                    </g>
                ))}
                {escala.ticksX.filter((_, i, lista) => lista.length < 5 || i % 2 === 0).map(t => (
                    <text key={`x${t}`} x={escala.x(t)} y={ALTO - 6} textAnchor="middle" className="fill-[#7B8388] font-garet text-[9px]">{formatLengthValue(t)}</text>
                ))}
                <path d={escala.area} fill="#5C2472" fillOpacity="0.12" />
                <path d={escala.linea} fill="none" stroke="#5C2472" strokeWidth="2" strokeLinejoin="round" />
                {activo && (
                    <>
                        <line x1={escala.x(activo.metros)} x2={escala.x(activo.metros)} y1={MARGEN.arr} y2={ALTO - MARGEN.aba} stroke="#2B2F33" strokeDasharray="3 3" />
                        <circle cx={escala.x(activo.metros)} cy={escala.y(activo.alt)} r="4.5" fill="#FF8300" stroke="#FFFFFF" strokeWidth="2" />
                    </>
                )}
                <rect
                    x={MARGEN.izq}
                    y={MARGEN.arr}
                    width={ANCHO - MARGEN.izq - MARGEN.der}
                    height={ALTO - MARGEN.arr - MARGEN.aba}
                    fill="transparent"
                    onPointerMove={mover}
                    onPointerLeave={salir}
                />
            </svg>
            {activo && (
                <span
                    className="pointer-events-none absolute -translate-x-1/2 -translate-y-[120%] rounded-md bg-[#1F2326] px-2 py-1 font-garet text-[11px] text-white tabular-nums whitespace-nowrap"
                    style={{ left: `${(escala.x(activo.metros) / ANCHO) * 100}%`, top: `${(escala.y(activo.alt) / ALTO) * 100}%` }}
                >
                    {formatLengthValue(activo.metros)} · {metros(activo.alt)}
                </span>
            )}
        </div>
    );
};

export default PerfilElevacion;

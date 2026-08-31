import { useState } from 'react';
import DropdownPill from '@components/DropdownPill';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { COLORES_COMPARADOR } from '@pages/maps/helpers/coloresComparador';

const ALTO = 160;
const MARGEN = { arriba: 16, derecha: 16, abajo: 34, izquierda: 30 };
const PASO = 104;
const NIVELES = [0, 25, 50, 75, 100];

const color = (indice) => COLORES_COMPARADOR[indice % COLORES_COMPARADOR.length];

const corta = (texto, tope = 18) => (texto.length > tope ? `${texto.slice(0, tope - 1)}…` : texto);

const ComparadorGrafica = ({ columnas, filas }) => {
    const [serie, setSerie] = useState(0);
    const grupos = filas.filter(f => !f.esBase && f.enPuntos);
    const activa = Math.min(serie, columnas.length - 1);
    const columna = columnas[activa];

    if (grupos.length < 2) {
        return (
            <p className="text-[11px]/[14px] font-garet text-[#8894AE] py-2">
                {grupos.length === 0
                    ? 'Esta capa no tiene indicadores que sean parte de un total, así que no hay proporciones que graficar. Su comparación se lee en la tabla.'
                    : 'Con un solo indicador proporcional no hay perfil que trazar. Su comparación se lee en la tabla.'}
            </p>
        );
    }

    const ancho = MARGEN.izquierda + MARGEN.derecha + PASO * (grupos.length - 1) + 40;
    const x = (i) => MARGEN.izquierda + 20 + PASO * i;
    const y = (pct) => MARGEN.arriba + (ALTO - MARGEN.arriba - MARGEN.abajo) * (1 - pct / 100);

    const puntos = grupos.map((fila, i) => {
        const pct = fila.celdas[activa]?.porcentaje;
        return pct === null || pct === undefined
            ? null
            : { i, pct, x: x(i), y: y(pct), fila, bruto: fila.celdas[activa].bruto };
    });

    const validos = puntos.filter(Boolean);
    const segmentos = [];
    let actual = [];
    for (const punto of puntos) {
        if (punto) actual.push(punto);
        else if (actual.length) { segmentos.push(actual); actual = []; }
    }
    if (actual.length) segmentos.push(actual);

    const alto = validos.reduce((a, b) => (b.pct > a.pct ? b : a), validos[0]);
    const bajo = validos.reduce((a, b) => (b.pct < a.pct ? b : a), validos[0]);
    const tono = color(activa);

    return (
        <div className="font-garet">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
                <DropdownPill
                    etiqueta="Municipio a graficar"
                    valor={String(activa)}
                    onCambio={(v) => setSerie(Number(v))}
                    opciones={columnas.map((c, i) => ({ valor: String(i), texto: c.nombre }))}
                />
                <span className="flex items-center gap-1.5">
                    <span className="w-3 h-[2px] rounded-full shrink-0" style={{ background: tono }} aria-hidden="true" />
                    <span className="text-[10px]/[13px] text-[#8894AE]">perfil de {columna?.nombre}</span>
                </span>
            </div>

            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-gray-400 pb-1">
                <svg
                    viewBox={`0 0 ${ancho} ${ALTO}`}
                    width={ancho}
                    height={ALTO}
                    role="img"
                    aria-label={`Perfil de ${columna?.nombre}: porcentaje de su total en cada indicador`}
                    className="max-w-none"
                >
                    {NIVELES.map(nivel => (
                        <g key={nivel}>
                            <line
                                x1={MARGEN.izquierda} x2={ancho - MARGEN.derecha}
                                y1={y(nivel)} y2={y(nivel)}
                                stroke="#E9EEF8" strokeWidth="1"
                            />
                            <text x={MARGEN.izquierda - 6} y={y(nivel) + 3} textAnchor="end" fontSize="8" fill="#A9B4CC">
                                {nivel}
                            </text>
                        </g>
                    ))}

                    {grupos.map((fila, i) => (
                        <text key={fila.nombre} x={x(i)} y={ALTO - 14} textAnchor="middle" fontSize="8.5" fill="#465055">
                            {corta(fila.nombre)}
                            <title>{fila.nombre}</title>
                        </text>
                    ))}

                    {segmentos.map((segmento, s) => (
                        <polyline
                            key={s}
                            points={segmento.map(p => `${p.x},${p.y}`).join(' ')}
                            fill="none"
                            stroke={tono}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    ))}

                    {validos.map(punto => (
                        <g key={punto.i}>
                            <circle cx={punto.x} cy={punto.y} r="4" fill={tono} stroke="#F9FBFF" strokeWidth="2">
                                <title>
                                    {`${punto.fila.nombre}: ${formatNumber(String(punto.bruto))} (${punto.pct.toFixed(1)}%)`}
                                </title>
                            </circle>
                            {(punto === alto || punto === bajo) && (
                                <text
                                    x={punto.x}
                                    y={punto.y - 8}
                                    textAnchor="middle"
                                    fontSize="8.5"
                                    fontWeight="700"
                                    fill="#191919"
                                >
                                    {punto.pct.toFixed(1)}%
                                </text>
                            )}
                        </g>
                    ))}
                </svg>
            </div>

            <p className="text-[10px]/[13px] text-[#8894AE] mt-1">
                Porcentaje sobre el total de {columna?.nombre}. Se marcan su indicador más alto y el más bajo;
                el resto sale al pasar el cursor.
            </p>
        </div>
    );
};

export default ComparadorGrafica;

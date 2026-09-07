import { useState } from 'react';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { gruposDe, seriesDe } from '@pages/maps/helpers/comparadorSeries';

const ALTO = 250;
const MARGEN = { arriba: 24, derecha: 28, abajo: 44, izquierda: 38 };
const ANCHO_BASE = 640;
const NIVELES = [0, 25, 50, 75, 100];

const corta = (texto, tope) => (texto.length > tope ? `${texto.slice(0, tope - 1)}…` : texto);

const ComparadorGrafica = ({ columnas, filas, eje, municipio, indicador }) => {
    const [resaltada, setResaltada] = useState(null);
    const grupos = gruposDe(filas);

    if (grupos.length < 2) {
        return (
            <p className="text-[11px]/[14px] font-garet text-[#8894AE] py-2">
                {grupos.length === 0
                    ? 'Esta capa no tiene indicadores que sean parte de un total, así que no hay proporciones que graficar. Su comparación se lee en la tabla.'
                    : 'Con un solo indicador proporcional no hay perfil que trazar. Su comparación se lee en la tabla.'}
            </p>
        );
    }

    const series = seriesDe(columnas, grupos, eje, eje === 'propiedad' ? indicador : municipio);
    if (series.length === 0) return null;

    const [primera] = series;
    const n = primera.ejes.length;
    const unaSola = series.length === 1;
    if (n < 2) {
        return (
            <p className="text-[11px]/[14px] font-garet text-[#8894AE] py-2">
                Agrega otro municipio para trazar este indicador.
            </p>
        );
    }

    const paso = (ANCHO_BASE - MARGEN.izquierda - MARGEN.derecha) / (n - 1);
    const x = (i) => MARGEN.izquierda + paso * i;
    const y = (pct) => MARGEN.arriba + (ALTO - MARGEN.arriba - MARGEN.abajo) * (1 - pct / 100);

    const trazos = series.map(serie => {
        const validos = serie.puntos.filter(Boolean).map(p => ({ ...p, x: x(p.i), y: y(p.pct) }));
        const segmentos = [];
        let actual = [];
        for (const punto of serie.puntos) {
            if (punto) actual.push(validos.find(v => v.i === punto.i));
            else if (actual.length) { segmentos.push(actual); actual = []; }
        }
        if (actual.length) segmentos.push(actual);

        const extremos = validos.length
            ? [
                validos.reduce((a, b) => (b.pct > a.pct ? b : a), validos[0]),
                validos.reduce((a, b) => (b.pct < a.pct ? b : a), validos[0]),
            ]
            : [];

        return { serie, validos, segmentos, extremos };
    });

    const tope = Math.max(10, Math.floor(paso / 7));

    return (
        <div className="font-garet">
            <svg
                viewBox={`0 0 ${ANCHO_BASE} ${ALTO}`}
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label={series.map(s => s.pie).join('. ')}
                className="w-full h-auto block"
            >
                {NIVELES.map(nivel => (
                    <g key={nivel}>
                        <line
                            x1={MARGEN.izquierda} x2={ANCHO_BASE - MARGEN.derecha}
                            y1={y(nivel)} y2={y(nivel)}
                            stroke="#E9EEF8" strokeWidth="1"
                        />
                        <text x={MARGEN.izquierda - 8} y={y(nivel) + 4} textAnchor="end" fontSize="10" fill="#A9B4CC">
                            {nivel}
                        </text>
                    </g>
                ))}

                {primera.ejes.map((etiqueta, i) => (
                    <text key={etiqueta} x={x(i)} y={ALTO - 18} textAnchor="middle" fontSize="10.5" fill="#465055">
                        {corta(etiqueta, tope)}
                        <title>{etiqueta}</title>
                    </text>
                ))}

                {trazos.map(({ serie, segmentos }) => {
                    const apagada = resaltada !== null && resaltada !== serie.titulo;
                    return (
                        <g
                            key={serie.titulo}
                            onMouseEnter={() => setResaltada(serie.titulo)}
                            onMouseLeave={() => setResaltada(null)}
                            style={{ opacity: apagada ? 0.25 : 1, transition: 'opacity 150ms' }}
                        >
                            {segmentos.map((segmento, i) => (
                                <polyline
                                    key={`golpe-${i}`}
                                    points={segmento.map(p => `${p.x},${p.y}`).join(' ')}
                                    fill="none"
                                    stroke="transparent"
                                    strokeWidth="14"
                                    strokeLinecap="round"
                                />
                            ))}
                            {segmentos.map((segmento, i) => (
                                <polyline
                                    key={i}
                                    points={segmento.map(p => `${p.x},${p.y}`).join(' ')}
                                    fill="none"
                                    stroke={serie.tono}
                                    strokeWidth={resaltada === serie.titulo ? 3 : 2}
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            ))}
                        </g>
                    );
                })}

                {trazos.map(({ serie, validos, extremos }) => {
                    const apagada = resaltada !== null && resaltada !== serie.titulo;
                    const conValores = unaSola || resaltada === serie.titulo;
                    return (
                        <g
                            key={`p-${serie.titulo}`}
                            onMouseEnter={() => setResaltada(serie.titulo)}
                            onMouseLeave={() => setResaltada(null)}
                            style={{ opacity: apagada ? 0.25 : 1, transition: 'opacity 150ms' }}
                        >
                            {validos.map(punto => (
                                <g key={punto.i}>
                                    <circle cx={punto.x} cy={punto.y} r="5" fill={serie.tono} stroke="#F9FBFF" strokeWidth="2">
                                        <title>
                                            {`${serie.titulo} · ${punto.etiqueta}: ${formatNumber(String(punto.bruto))} (${punto.pct.toFixed(1)}%)`}
                                        </title>
                                    </circle>
                                    {(conValores || extremos.includes(punto)) && (
                                        <text
                                            x={punto.x}
                                            y={punto.y - 10}
                                            textAnchor="middle"
                                            fontSize="10"
                                            fontWeight="700"
                                            fill="#191919"
                                        >
                                            {punto.pct.toFixed(1)}%
                                        </text>
                                    )}
                                </g>
                            ))}
                        </g>
                    );
                })}
            </svg>

            <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-1">
                {series.map(serie => (
                    <li
                        key={serie.titulo}
                        onMouseEnter={() => setResaltada(serie.titulo)}
                        onMouseLeave={() => setResaltada(null)}
                        className={`flex items-center gap-1.5 min-w-0 cursor-default transition-opacity ${resaltada !== null && resaltada !== serie.titulo ? 'opacity-40' : ''}`}
                    >
                        <span className="w-3 h-[2px] rounded-full shrink-0" style={{ background: serie.tono }} aria-hidden="true" />
                        <span className="text-[11px]/[14px] text-[#8894AE] truncate">
                            {unaSola ? serie.pie : serie.titulo}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default ComparadorGrafica;

import { useId } from 'react';
import SymbolGlyph from '@mapsComponents/SymbolGlyph';
import { colorDeFondo, tramosDeForma } from '@pages/maps/helpers/eventoDiversion';

const FONDO_BASE = { forma: 'solido', colores: ['blanco'] };
const BORDE_BASE = { forma: 'ninguno', colores: [] };
const GROSOR = 3.2;

const Franjas = ({ id, colores }) => (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
        {colores.flatMap((color, i) => [
            <stop key={`${i}-desde`} offset={`${(i / colores.length) * 100}%`} style={{ stopColor: color }} />,
            <stop key={`${i}-hasta`} offset={`${((i + 1) / colores.length) * 100}%`} style={{ stopColor: color }} />,
        ])}
    </linearGradient>
);

const EventoBotonGlyph = ({ botonEstilo, symbol, size, iconSize }) => {
    const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
    const fondo = botonEstilo?.fondo || FONDO_BASE;
    const borde = botonEstilo?.borde || BORDE_BASE;
    const nFondo = tramosDeForma(fondo.forma);
    const nBorde = tramosDeForma(borde.forma);
    const coloresFondo = fondo.colores.slice(0, nFondo).map(colorDeFondo);
    const anillo = nBorde > 0;
    const relleno = nFondo === 0 ? 'none' : nFondo === 1 ? coloresFondo[0] : `url(#fondo${uid})`;
    const radio = anillo ? 20 - GROSOR / 2 - 0.4 : 19.2;
    const glifo = iconSize ?? Math.round((size || 20) * (anillo ? 0.5 : 0.62));
    const medida = size ? { width: size, height: size } : { width: '100%', height: '100%' };

    return (
        <span className="relative inline-flex items-center justify-center shrink-0" style={medida}>
            <svg viewBox="0 0 40 40" width="100%" height="100%" className="absolute inset-0" aria-hidden="true">
                {(nFondo > 1 || anillo) && (
                    <defs>
                        {nFondo > 1 && <Franjas id={`fondo${uid}`} colores={coloresFondo} />}
                        {anillo && <Franjas id={`borde${uid}`} colores={borde.colores.slice(0, nBorde)} />}
                    </defs>
                )}
                <circle
                    cx="20"
                    cy="20"
                    r={radio}
                    style={{ fill: relleno, stroke: anillo ? `url(#borde${uid})` : 'none', strokeWidth: anillo ? GROSOR : 0 }}
                />
                {anillo && <circle cx="20" cy="20" r="19.65" fill="none" stroke="rgba(0,0,0,.16)" strokeWidth=".5" />}
            </svg>
            <SymbolGlyph symbol={symbol} size={glifo} className="relative" />
        </span>
    );
};

export default EventoBotonGlyph;

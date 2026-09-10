import SymbolGlyph from '@mapsComponents/SymbolGlyph';

const EventoFunAguila = ({ carga }) => (
    <span className="flex flex-col items-center">
        <svg viewBox="0 0 64 36" width="46" height="26" className="overflow-visible" aria-hidden="true">
            <g className="evento-fun-ala"><path d="M31 16 C24 5 11 2 2 7 C11 9 20 13 29 18 Z" fill="#3B2A22" /></g>
            <g className="evento-fun-ala"><path d="M33 16 C40 5 53 2 62 7 C53 9 44 13 35 18 Z" fill="#3B2A22" /></g>
            <ellipse cx="32" cy="18" rx="6" ry="3.4" fill="#4A352A" />
            <circle cx="38.6" cy="15.6" r="2.6" fill="#F4EFE9" />
            <path d="M40.6 15.2 L43.6 16.2 L40.6 17.2 Z" fill="#E9A31B" />
            <path d="M26.5 18.5 L20.5 22.5 L22 18 Z" fill="#3B2A22" />
        </svg>
        {carga && <SymbolGlyph symbol={carga} size={14} className="-mt-1.5" />}
    </span>
);

export default EventoFunAguila;

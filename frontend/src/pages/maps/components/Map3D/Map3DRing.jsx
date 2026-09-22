const RING_SIZE = 'size-8.5';

const Map3DRing = ({ label, texto, porcentaje, tono, abierto, onToggle, botonRef }) => (
    <button
        ref={botonRef}
        type="button"
        onClick={onToggle}
        aria-expanded={abierto}
        aria-label={label}
        title={label}
        className={`relative ${RING_SIZE} shrink-0 rounded-full grid place-items-center cursor-pointer`}
    >
        <span
            className="absolute inset-0 rounded-full"
            style={{
                background: `conic-gradient(${tono} ${porcentaje}%, #E6E2EC 0)`,
                mask: 'radial-gradient(circle, transparent 12px, #000 13px)',
                WebkitMask: 'radial-gradient(circle, transparent 12px, #000 13px)',
            }}
        />
        <span className="relative font-garet text-[10px] font-bold tabular-nums leading-none text-[#2b2f33]">{texto}</span>
    </button>
);

export default Map3DRing;

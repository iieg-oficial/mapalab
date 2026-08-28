import { useState } from 'react';
import { headerDisplay, MAX_LABEL, MAX_ROWS } from '../helpers/infoboxDraft';

const CHIP = 'px-2.5 py-1 rounded-full text-[12px] font-garet border transition-colors';

export const FieldChip = ({ field, onAdd, disabled }) => (
    <button
        type="button"
        draggable={!disabled}
        onDragStart={(e) => e.dataTransfer.setData('text/plain', field)}
        onClick={() => !disabled && onAdd(field)}
        disabled={disabled}
        className={`${CHIP} ${disabled
            ? 'border-[#E3E0E8] text-[#A8A2B0] cursor-not-allowed'
            : 'border-purple/25 text-purple hover:bg-purple hover:text-white cursor-grab'}`}
    >
        {field}
    </button>
);

export const Zone = ({ zone, draft, onDrop, onRemove, onRename, onMove }) => {
    const [over, setOver] = useState(false);
    const rows = zone.id === 'header'
        ? (draft.headerField ? [{ key: 'header', display: headerDisplay(draft.headerField), label: null }] : [])
        : draft[zone.id];
    const lleno = zone.id !== 'header' && rows.length >= MAX_ROWS;

    return (
        <div
            onDragOver={(e) => { e.preventDefault(); setOver(true); }}
            onDragLeave={() => setOver(false)}
            onDrop={(e) => {
                e.preventDefault();
                setOver(false);
                const field = e.dataTransfer.getData('text/plain');
                if (field) onDrop(zone.id, field);
            }}
            className={`rounded-xl border-2 border-dashed p-3 transition-colors ${over
                ? 'border-orange bg-orange/5'
                : 'border-[#E3E0E8] bg-[#F9FBFF]'}`}
        >
            <div className="flex items-baseline justify-between gap-2 mb-2">
                <span className="text-[13px] font-garet font-bold text-purple">{zone.titulo}</span>
                <span className="text-[11px] font-garet text-[#6E7477]">{zone.ayuda}</span>
            </div>

            {rows.length === 0 ? (
                <p className="text-[12px] font-garet text-[#A8A2B0] py-2">
                    Arrastra un campo aquí o haz clic en uno de la lista.
                </p>
            ) : (
                <div className="flex flex-col gap-1.5">
                    {rows.map((row, idx) => (
                        <div key={row.key} className="flex items-center gap-2 bg-white rounded-lg px-2 py-1.5 border border-[#E3E0E8]">
                            {zone.id !== 'header' && (
                                <div className="flex flex-col shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => onMove(zone.id, idx, idx - 1)}
                                        disabled={idx === 0}
                                        aria-label="Subir"
                                        className="text-[9px] leading-none text-purple disabled:text-[#D8D4DE] cursor-pointer disabled:cursor-default"
                                    >▲</button>
                                    <button
                                        type="button"
                                        onClick={() => onMove(zone.id, idx, idx + 1)}
                                        disabled={idx === rows.length - 1}
                                        aria-label="Bajar"
                                        className="text-[9px] leading-none text-purple disabled:text-[#D8D4DE] cursor-pointer disabled:cursor-default"
                                    >▼</button>
                                </div>
                            )}
                            <span className="shrink-0 text-[11px] font-garet text-[#6E7477] max-w-[35%] truncate" title={row.display}>
                                {row.display}
                            </span>
                            {zone.id !== 'header' && (
                                <input
                                    value={row.label}
                                    maxLength={MAX_LABEL}
                                    onChange={(e) => onRename(zone.id, row.key, e.target.value)}
                                    placeholder="Cómo se llama para quien consulta"
                                    className="flex-1 min-w-0 text-[12px] font-garet text-[#454545] bg-[#F9FBFF] rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-purple/40"
                                />
                            )}
                            <button
                                type="button"
                                onClick={() => onRemove(zone.id, row.key)}
                                aria-label={`Quitar ${row.display}`}
                                className="shrink-0 size-5 rounded-full text-[#FF577D] hover:bg-[#FFE6EC] flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {lleno && (
                <p className="mt-2 text-[11px] font-garet text-orange">Máximo {MAX_ROWS} campos en este bloque.</p>
            )}
        </div>
    );
};


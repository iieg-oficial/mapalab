import { formatNumber } from '@pages/maps/helpers/formatNumber';

const HexbinLegend = ({ entries, cells }) => {
    if (!Array.isArray(entries) || entries.length === 0) return null;

    return (
        <div className="flex flex-col gap-1 px-1 py-1.5">
            <span className="text-[10px] font-garet text-[#6E7477]">
                Elementos por celda{cells ? ` · ${formatNumber(cells)} celdas` : ''}
            </span>
            <ul className="flex flex-col gap-0.5">
                {entries.map(entry => (
                    <li key={entry.color} className="flex items-center gap-1.5">
                        <span
                            aria-hidden="true"
                            className="size-3 rounded-[2px] shrink-0 border border-white/60"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-[10px] font-garet text-[#465055]">
                            {entry.from === entry.to
                                ? formatNumber(entry.from)
                                : `${formatNumber(entry.from)} – ${formatNumber(entry.to)}`}
                        </span>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default HexbinLegend;

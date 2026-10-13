import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { textoAcercate } from '@pages/maps/helpers/hexbinStyles';

const HexbinLegend = ({ entries, acercate = null }) => {
    if (acercate) return <p className="px-3 py-3 text-[10px] font-garet text-[#465055]">{textoAcercate(acercate)}</p>;
    if (!Array.isArray(entries) || entries.length === 0) return null;

    return (
        <ul className="flex flex-col gap-1 px-3 py-3">
            {entries.map(entry => (
                <li key={entry.color} className="flex items-center gap-2">
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
    );
};

export default HexbinLegend;

import Tooltip from '@components/Tooltip';
import { useMapsContext } from '@hooks/useMaps';

const NEXT_MEMBERSHIP = { A: 'AB', AB: 'B', B: 'A' };

const SlotBadge = ({ membership, onCycle }) => {
    const { setHighlightedSlots } = useMapsContext();
    const nextMembership = NEXT_MEMBERSHIP[membership];
    const tooltip = membership === 'AB'
        ? `Esta capa esta en los dos slots — click para mover solo a ${nextMembership}`
        : `Esta capa esta solo en el slot ${membership} — click para ${nextMembership === 'AB' ? 'agregar al otro' : `mover a ${nextMembership}`}`;

    const handleClick = (e) => {
        e.stopPropagation();
        onCycle?.(nextMembership);
        setHighlightedSlots?.(nextMembership);
    };
    const handleMouseEnter = (e) => {
        e.stopPropagation();
        setHighlightedSlots?.(membership);
    };
    const handleMouseLeave = (e) => {
        e.stopPropagation();
        setHighlightedSlots?.(null);
    };

    return (
        <Tooltip content={tooltip}>
            <button
                type="button"
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="shrink-0 inline-flex h-5 rounded-full overflow-hidden border border-gray-200 text-[10px] font-garet font-bold leading-none cursor-pointer hover:opacity-80 transition-opacity"
            >
                {(membership === 'A' || membership === 'AB') && (
                    <span className="px-1.5 flex items-center bg-[#5C2472] text-white">A</span>
                )}
                {(membership === 'B' || membership === 'AB') && (
                    <span className="px-1.5 flex items-center bg-[#FF8300] text-white">B</span>
                )}
            </button>
        </Tooltip>
    );
};

export default SlotBadge;

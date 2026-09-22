import Tooltip from '@components/Tooltip';
import { useMapsContext } from '@hooks/useMaps';
import { trackSwipeSlotChange } from '@services/analyticsService';

const NEXT_MEMBERSHIP = { A: 'AB', AB: 'B', B: 'A' };

const SlotBadge = ({ membership, onCycle, layerId }) => {
    const { highlightSlots } = useMapsContext();
    const nextMembership = NEXT_MEMBERSHIP[membership];
    const tooltip = membership === 'AB'
        ? `Esta capa esta en los dos slots — click para mover solo a ${nextMembership}`
        : `Esta capa esta solo en el slot ${membership} — click para ${nextMembership === 'AB' ? 'agregar al otro' : `mover a ${nextMembership}`}`;

    const handleClick = (e) => {
        e.stopPropagation();
        trackSwipeSlotChange(layerId || null, membership, nextMembership);
        onCycle?.(nextMembership);
        highlightSlots?.(nextMembership, { temporal: true });
    };
    const handleMouseEnter = () => {
        highlightSlots?.(membership);
    };
    const handleMouseLeave = () => {
        highlightSlots?.(null);
    };

    return (
        <Tooltip content={tooltip} key={membership}>
            <button
                type="button"
                onClick={handleClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                aria-label={tooltip}
                className="shrink-0 inline-flex h-6 rounded-full overflow-hidden border border-gray-200 text-[10px] font-garet font-bold leading-none cursor-pointer hover:opacity-80 transition-opacity"
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

import Tooltip from '@components/Tooltip';

const SlotBadge = ({ membership }) => {
    const tooltip = membership === 'AB'
        ? 'Esta capa esta en los dos slots (A y B)'
        : `Esta capa esta solo en el slot ${membership}`;
    return (
        <Tooltip content={tooltip}>
            <span className="shrink-0 inline-flex h-5 rounded-full overflow-hidden border border-gray-200 text-[10px] font-garet font-bold leading-none">
                {(membership === 'A' || membership === 'AB') && (
                    <span className="px-1.5 flex items-center bg-[#5C2472] text-white">A</span>
                )}
                {(membership === 'B' || membership === 'AB') && (
                    <span className="px-1.5 flex items-center bg-[#FF8300] text-white">B</span>
                )}
            </span>
        </Tooltip>
    );
};

export default SlotBadge;

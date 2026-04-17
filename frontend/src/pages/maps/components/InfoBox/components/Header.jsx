import Icon from '@components/Icon';

const FeatureHeader = ({ value, onClose, index, total }) => {
    if (!value) return null;

    const showBadge = index != null && total != null && total > 0;

    return (
        <div className="w-full min-h-[61px] bg-[#EFF3FC] rounded-t-[10px] flex items-start gap-2 px-2 py-2 mb-3">
            <span className="w-10 shrink-0 pt-0.5 font-garet font-bold text-[10px]/[16px] text-[#5C2472] tabular-nums">
                {showBadge ? `${index}/${total}` : ''}
            </span>

            <h3 className="flex-1 self-center text-center font-garet font-bold text-[12px]/[16px] text-[#2E4372] tracking-normal break-words">
                {value}
            </h3>

            <span className="w-10 shrink-0 flex justify-end">
                {onClose && (
                    <Icon
                        name="close"
                        className="size-5 text-[#8E8E8E] hover:text-[#465055] transition-colors cursor-pointer"
                        tooltip="Cerrar esta tarjeta"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                    />
                )}
            </span>
        </div>
    );
};

export default FeatureHeader;

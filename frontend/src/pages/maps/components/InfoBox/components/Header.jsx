import Icon from '@components/Icon';

const FeatureHeader = ({ value, onClose, index, total }) => {
    if (!value) return null;

    const showBadge = index != null && total != null && total > 0;

    return (
        <div className="relative w-full min-h-[61px] bg-[#EFF3FC] rounded-t-[10px] px-12 py-2 mb-3 flex items-center">
            {showBadge && (
                <span className="absolute left-2 top-2 font-garet font-bold text-[10px]/[16px] text-[#5C2472] tabular-nums whitespace-nowrap pointer-events-none">
                    {`${index}/${total}`}
                </span>
            )}

            <h3 className="w-full my-3 text-center font-garet font-bold text-[12px]/[16px] text-[#2E4372] tracking-normal break-words">
                {value}
            </h3>

            {onClose && (
                <span className="absolute right-2 top-2 flex">
                    <Icon
                        name="close"
                        className="size-5 text-[#8E8E8E] hover:text-[#465055] transition-colors cursor-pointer"
                        tooltip="Cerrar esta tarjeta"
                        onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                        }}
                    />
                </span>
            )}
        </div>
    );
};

export default FeatureHeader;

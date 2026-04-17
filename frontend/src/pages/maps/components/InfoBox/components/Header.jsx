import Icon from '@components/Icon';

const FeatureHeader = ({ value, onClose, index, total }) => {
    if (!value) return null;

    const showBadge = index != null && total != null && total > 0;

    return (
        <h3
            className="
                relative w-full h-[61px] bg-[#EFF3FC] rounded-t-[10px]
                flex items-center justify-center text-center px-4 py-2 mb-3
                font-garet font-bold text-[12px]/[16px] text-[#2E4372] tracking-normal
            "
        >
            {value}
            {showBadge && (
                <span className="absolute left-2 top-2 font-garet font-bold text-[10px]/[16px] text-[#5C2472] tabular-nums">
                    {index}/{total}
                </span>
            )}
            {onClose && (
                <Icon
                    name="close"
                    className="size-5 absolute right-2 top-2 text-[#8E8E8E] hover:text-[#465055] transition-colors"
                    tooltip="Cerrar esta tarjeta"
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                />
            )}
        </h3>
    );
};

export default FeatureHeader;

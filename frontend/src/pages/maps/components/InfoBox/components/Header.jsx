import Icon from '@components/Icon';

const FeatureHeader = ({ value, onClose }) => {
    if (!value) return null;

    return (
        <h3
            className="
                relative w-[239px] h-[61px] bg-[#EFF3FC] rounded-t-[10px]
                flex items-center justify-center text-center px-4 py-2 mb-3
                font-garet font-bold text-[12px]/[16px] text-[#2E4372] tracking-normal
            "
        >
            {value}
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

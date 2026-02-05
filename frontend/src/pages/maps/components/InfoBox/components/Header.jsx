import Icon from '@components/Icon';

const FeatureHeader = ({ value, onClose }) => {
    if (!value) return null;

    return (
        <h3 className="relative w-[239px] h-[61px] bg-[#EFF3FC] rounded-t-[10px] flex items-center justify-center text-center px-4 text-[12px] leading-[16px] font-bold font-['Garet'] text-[#2E4372] tracking-[0px] mb-3">
            {value}
            {onClose && (
                <div
                    onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                    }}
                    className="absolute right-2 top-2 cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <Icon name="close" size={14} />
                </div>
            )}
        </h3>
    );
};

export default FeatureHeader;

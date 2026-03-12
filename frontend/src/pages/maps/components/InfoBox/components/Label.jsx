const FeatureLabel = ({ value, color, bg, fullWidth = false }) => {
    if (!value) return null;

    return (
        <p
            className={`font-garet font-bold text-[10px]/[14px] px-2 py-1 rounded-[5px]${fullWidth ? ' w-full' : ''}`}
            style={{ color, backgroundColor: bg }}
        >
            {value}
        </p>
    );
};

export default FeatureLabel;

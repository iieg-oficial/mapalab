const FeatureLabel = ({ value, color, bg, fullWidth = false }) => {
    if (!value) return null;

    if (fullWidth) {
        return (
            <div className="w-full">
                <p
                    className="font-garet font-bold text-[10px]/[14px] px-2 py-1 rounded-[5px] w-fit"
                    style={{ color, backgroundColor: bg }}
                >
                    {value}
                </p>
            </div>
        );
    }

    return (
        <p
            className="font-garet font-bold text-[10px]/[14px] px-2 py-1 rounded-[5px]"
            style={{ color, backgroundColor: bg }}
        >
            {value}
        </p>
    );
};

export default FeatureLabel;

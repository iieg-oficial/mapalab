const FeatureIconText = ({ value }) => {
    if (!value) return null;

    return (
        <div className="flex items-start gap-2 mb-3 text-sm text-gray-700">
            <span className="text-base">📍</span>
            <span className="flex-1">{value}</span>
        </div>
    );
};

export default FeatureIconText;

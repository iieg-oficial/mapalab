const FeatureLabel = ({ value, index = 0 }) => {
    if (!value) return null;

    const getColorClasses = (idx) => {
        if (idx === 0) return 'text-orange-600 bg-orange-50';
        if (idx === 1 || idx === 2) return 'text-purple-600 bg-purple-50';
        return 'text-blue-600 bg-blue-50';
    };

    const colorClasses = getColorClasses(index);

    return (
        <p className={`text-xs ${colorClasses} px-2 py-1 rounded-[5px]`}>
            {value}
        </p>
    );
};

export default FeatureLabel;

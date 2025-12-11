const FeatureLabelGroup = ({ values }) => {
    if (!values || values.length === 0) return null;

    const filteredValues = values.filter(v => v !== null && v !== undefined && v !== '');
    if (filteredValues.length === 0) return null;

    return (
        <p className="text-sm text-gray-600 mb-2">
            {filteredValues.join(', ')}
        </p>
    );
};

export default FeatureLabelGroup;

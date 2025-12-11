const FeatureList = ({ rows }) => {
    if (!rows || rows.length === 0) return null;

    const validRows = rows.filter(row => row.value !== null && row.value !== undefined && row.value !== '');
    if (validRows.length === 0) return null;

    const formatValue = (label, value) => {
        if (label.includes('Año de la información')) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date.getFullYear();
            }
        }
        if (label.includes('Fecha')) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
        }
        return value;
    };

    return (
        <div className="space-y-1 mb-3">
            {validRows.map((row, idx) => (
                <div key={idx} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    <span className="font-bold text-gray-700 shrink-0">{row.label}:</span>
                    <span className="text-gray-900 break-words">{formatValue(row.label, row.value)}</span>
                </div>
            ))}
        </div>
    );
};

export default FeatureList;

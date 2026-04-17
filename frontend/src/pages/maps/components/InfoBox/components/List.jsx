import { formatNumber } from '@pages/maps/helpers/formatNumber';

const FeatureList = ({ rows, variant = 'desktop' }) => {
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

    const size = variant === 'mobile' ? 'text-[12px]' : 'text-[10px]';

    return (
        <div className="space-y-1 mb-3">
            {validRows.map((row, idx) => (
                <div key={idx} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                    {row.label && (
                        <span className={`font-bold font-garet ${size} text-[#465055] tracking-normal shrink-0`}>
                            {row.label}:
                        </span>
                    )}
                    <span className={`font-medium text-[#465055] ${size} tracking-normal break-words`}>
                        {row.raw ? formatValue(row.label, row.value) : formatNumber(formatValue(row.label, row.value))}
                    </span>
                </div>
            ))}
        </div>
    );
};

export default FeatureList;

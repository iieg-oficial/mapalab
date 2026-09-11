import { renderInlineBold } from '../utils/inlineBold.jsx';

const FeatureList = ({ rows, variant = 'desktop' }) => {
    if (!rows || rows.length === 0) return null;

    const validRows = rows.filter(row => row.value !== null && row.value !== undefined && row.value !== '');
    if (validRows.length === 0) return null;

    const size = variant === 'mobile' ? 'text-[12px]' : 'text-[10px]';

    return (
        <div className="space-y-1 mb-3">
            {validRows.map((row, idx) => {
                const formatted = renderInlineBold(row.value);
                const valueEl = row.values?.length ? (
                    <div className="flex flex-col gap-0.5 w-full">
                        {row.values.map((item, itemIdx) => (
                            <span
                                key={itemIdx}
                                className={`font-garet font-medium text-[#465055] ${size} tracking-normal break-words`}
                            >
                                {item}
                            </span>
                        ))}
                    </div>
                ) : row.href ? (
                    <a
                        href={row.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`font-garet font-medium text-[#5C2472] underline ${size} tracking-normal break-words`}
                    >
                        {formatted}
                    </a>
                ) : (
                    <span className={`font-garet font-medium text-[#465055] ${size} tracking-normal break-words`}>
                        {formatted}
                    </span>
                );
                return (
                    <div key={idx} className="flex flex-wrap items-baseline gap-x-2 text-sm">
                        {row.label && (
                            <span className={`font-bold font-garet ${size} text-[#465055] tracking-normal shrink-0`}>
                                {row.label}:
                            </span>
                        )}
                        {valueEl}
                    </div>
                );
            })}
        </div>
    );
};

export default FeatureList;

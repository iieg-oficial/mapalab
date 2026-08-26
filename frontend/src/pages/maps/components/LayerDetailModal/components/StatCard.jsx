import { formatNumber } from '@pages/maps/helpers/formatNumber';

const SIZES = {
    default: { box: 'p-3.5', value: 'text-[16px]/[30px]', simbolo: 'text-[12px]', label: 'text-[13px]/[16px]' },
    compact: { box: 'p-2', value: 'text-[11px]/[16px]', simbolo: 'text-[9px]', label: 'text-[9px]/[11px]' },
};

const StatCard = ({ label, value, simbolo, className = '', size = 'default' }) => {
    const s = SIZES[size] || SIZES.default;
    return (
        <div className={`bg-[#EFF3FC] rounded-[14px] ${s.box} min-h-auto flex flex-col justify-center ${className}`}>
            <div className="flex flex-col items-center justify-center text-center w-full">
                <p className={`${s.value} font-garet font-bold text-purple`}>
                    {formatNumber(value)}{simbolo && <span className={`${s.simbolo} font-medium ml-1`}>{simbolo}</span>}
                </p>
                <p className={`${s.label} font-garet font-medium text-[#465055] tracking-normal`}>
                    {label}
                </p>
            </div>
        </div>
    );
};

export default StatCard;

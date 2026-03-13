import { formatNumber } from '@pages/maps/helpers/formatNumber';

const StatCard = ({ label, value, simbolo, className = '' }) => {
    return (
        <div className={`bg-[#EFF3FC] rounded-[14px] p-3.5 min-h-[100px] flex flex-col justify-center ${className}`}>
            <div className="flex flex-col items-center justify-center text-center w-full">
                <p className="text-[16px]/[30px] font-garet font-bold text-[#465055]">
                    {formatNumber(value)}{simbolo && <span className="text-[12px] font-medium ml-1">{simbolo}</span>}
                </p>
                <p className="text-[13px]/[16px] font-garet font-medium text-[#465055] tracking-normal">
                    {label}
                </p>
            </div>
        </div>
    );
};

export default StatCard;

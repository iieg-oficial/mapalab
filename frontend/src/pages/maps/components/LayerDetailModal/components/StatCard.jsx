const StatCard = ({ label, value, className = '' }) => {
    return (
        <div className={`bg-[#EFF3FC] rounded-[14px] p-3.5 h-20 ${className}`}>
            <div className="flex flex-col items-center justify-center text-center">
                <p className="text-[16px]/[30px] font-garet font-bold text-[#465055]">
                    {value}
                </p>
                <p className="text-[13px]/[16px] font-garet font-medium text-[#465055] tracking-normal">
                    {label}
                </p>
            </div>
        </div>
    );
};

export default StatCard;

const InfoCard = ({ label, value, className = '' }) => {
    return (
        <div className={`bg-[#F9FBFF] rounded-[9px] px-3 py-2 ${className}`}>
            <p className="text-[13px] font-garet text-[#2E4372] tracking-normal">
                <span className="font-medium ">{label}:</span>{' '}
                <span className="font-bold text-[#2E4372]">{value}</span>
            </p>
        </div>
    );
};

export default InfoCard;

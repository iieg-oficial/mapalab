const InfoCard = ({ label, value, className = '' }) => {
    return (
        <div className={`bg-white rounded-lg border border-gray-200 px-2 py-1.5 ${className}`}>
            <p className="text-xs text-gray-700 leading-tight">
                <span className="font-semibold">{label}:</span>{' '}
                <span className="text-gray-600">{value}</span>
            </p>
        </div>
    );
};

export default InfoCard;

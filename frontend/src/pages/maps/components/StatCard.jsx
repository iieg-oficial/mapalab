const StatCard = ({ label, value, unit, className = '' }) => {
    return (
        <div className={`bg-gradient-to-br from-white to-gray-50 rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow ${className}`}>
            <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-3xl font-bold text-gray-800 mb-2">
                    {value}
                </p>
                <p className="text-xs text-gray-600 leading-tight">
                    {label}
                </p>
                {unit && (
                    <p className="text-xs text-gray-500 mt-1">{unit}</p>
                )}
            </div>
        </div>
    );
};

export default StatCard;

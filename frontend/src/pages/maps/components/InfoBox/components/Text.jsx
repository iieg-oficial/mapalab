const FeatureText = ({ label, value, variant = 'desktop' }) => {
    const size = variant === 'mobile' ? 'text-[12px]' : 'text-[10px]';
    return (
        <div className={`font-garet ${size} text-[#465055] tracking-normal mb-3`}>
            {label && <span className="font-bold">{label}</span>}
            {label && value && <span>: </span>}
            {value && <span className="font-medium">{value}</span>}
        </div>
    );
};

export default FeatureText;

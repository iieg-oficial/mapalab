const FeatureText = ({ label, value, href = null, variant = 'desktop' }) => {
    const size = variant === 'mobile' ? 'text-[12px]' : 'text-[10px]';
    const valueEl = href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="font-garet font-medium text-[#5C2472] underline">
            {value}
        </a>
    ) : (
        <span className="font-garet font-medium">{value}</span>
    );
    return (
        <div className={`font-garet ${size} text-[#465055] tracking-normal mb-3`}>
            {label && <span className="font-bold">{label}</span>}
            {label && value && <span>: </span>}
            {value && valueEl}
        </div>
    );
};

export default FeatureText;

const FeatureText = ({ label, value }) => {
    return (
        <div className="font-garet text-[10px] text-[#465055] tracking-normal mb-3">
            {label && <span className="font-bold">{label}</span>}
            {label && value && <span>: </span>}
            {value && <span className="font-medium">{value}</span>}
        </div>
    );
};

export default FeatureText;

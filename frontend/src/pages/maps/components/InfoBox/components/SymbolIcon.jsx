const SymbolIcon = ({ url, className = 'size-5' }) => {
    if (!url) return null;
    return (
        <img
            src={url}
            alt=""
            className={`${className} rounded shrink-0 object-cover object-top`}
            onError={(e) => { e.target.style.display = 'none'; }}
        />
    );
};

export default SymbolIcon;

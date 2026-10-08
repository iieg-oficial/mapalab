const Bar = ({ min = 0, max = 100, step = 1, value, onChange, fillColor = '#703089', className = '', ...rest }) => {
    const pct = ((value - min) / (max - min)) * 100;

    return (
        <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            {...rest}
            className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#FF8300] ${className}`}
            style={{
                background: `linear-gradient(to right, ${fillColor} 0%, ${fillColor} ${pct}%, rgb(70 80 85 / 0.2) ${pct}%, rgb(70 80 85 / 0.2) 100%)`
            }}
        />
    );
};

export default Bar;

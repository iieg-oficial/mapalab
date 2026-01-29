const Badge = ({ visible = true, count, className = '' }) => {
    if (!visible || count === undefined || count === null) return null;

    return (
        <span
            className={[
                'size-5 rounded-full bg-[#FF8300] text-white text-[8px] font-garet font-bold flex items-center justify-center',
                className
            ].join(' ')}
        >
            {count}
        </span>
    );
};

export default Badge;

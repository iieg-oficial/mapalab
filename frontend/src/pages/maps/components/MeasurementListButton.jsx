import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';

const MeasurementListButton = ({
    count = 0,
    onClick,
    buttonRef,
    className = ''
}) => {
    if (count <= 0) return null;

    return (
        <Tooltip content="Ver lista de mediciones" placement="right" delay={500}>
            <button
                ref={buttonRef}
                type="button"
                onClick={onClick}
                className={[
                    'relative w-full flex items-center justify-center px-3 py-2 rounded-xl border border-white/60  shadow backdrop-blur-sm bg-white/85  text-gray-700  hover:bg-blue-50  transition-colors',
                    className
                ].join(' ')}
                aria-label={`Ver lista de mediciones (${count})`}
            >
                <Icon name="list" />
                <span className="absolute -top-1 -right-1 min-w-[22px] h-5 px-1.5 rounded-full bg-blue-500 text-white text-[10px] font-semibold flex items-center justify-center shadow">
                    {count}
                </span>
            </button>
        </Tooltip>
    );
};

export default MeasurementListButton;

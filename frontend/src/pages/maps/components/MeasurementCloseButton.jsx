import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';

const MeasurementCloseButton = ({
    onClick,
    buttonRef,
    className = ''
}) => (
    <Tooltip content="Cerrar herramienta de mediciones" placement="right" delay={500}>
        <button
            ref={buttonRef}
            type="button"
            onClick={onClick}
            className={[
                'w-full backdrop-blur-sm text-white rounded-xl shadow px-3 py-2 transition-colors bg-red-500/90 hover:bg-red-600/90',
                className
            ].join(' ')}
            aria-label="Cerrar herramienta de mediciones"
        >
            <Icon name="close" />
        </button>
    </Tooltip>
);

export default MeasurementCloseButton;

import Tooltip from '@components/Tooltip';
import { externalIcons } from '@assets/icons';

const FloatingIconButton = ({
    iconKey,
    tooltip,
    onClick,
    placement = 'right',
    delay = 0,
    ariaLabel,
    className = '',
}) => (
    <Tooltip content={tooltip} placement={placement} delay={delay}>
        <button
            type="button"
            onClick={onClick}
            aria-label={ariaLabel || tooltip}
            className={`cursor-pointer size-auto transition-all duration-200 ${className}`}
        >
            <img src={externalIcons[iconKey]} alt={tooltip} className="size-10" />
        </button>
    </Tooltip>
);

export default FloatingIconButton;

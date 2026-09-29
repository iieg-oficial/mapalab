import Icon from '@components/Icon';
import Badge from '@components/Badge';
import Tooltip from '@components/Tooltip';
import { useColibriOpen } from '@hooks/useColibriOpen';

const ReportButton = ({
    variant = 'floating',
    extraContext,
    label = 'Reportar',
    className = '',
    onTrack,
}) => {
    const open = useColibriOpen();
    const handleClick = (e) => {
        e?.stopPropagation?.();
        onTrack?.();
        open(extraContext);
    };

    if (variant === 'inline') {
        return (
            <button
                type="button"
                onClick={handleClick}
                className={`inline-flex items-center gap-1.5 text-sm font-medium text-[#5C2472] hover:text-[#4a1d5c] hover:underline ${className}`}
            >
                <Icon name="bug" className="w-4 h-4" />
                <span>{label}</span>
            </button>
        );
    }

    return (
        <Tooltip content={label} placement="left" delay={400}>
            <button
                type="button"
                onClick={handleClick}
                aria-label={label}
                className={`relative w-7 h-7 md:w-6 md:h-6 rounded-full bg-white flex items-center justify-center text-purple hover:text-purple-deep shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)] transition-colors ${className}`}
            >
                <Icon name="bug" className="w-3.5 h-3.5 md:w-3 md:h-3" />
                <Badge variant="pill" color="orange" text="BETA" className="absolute -top-2 left-1/2 -translate-x-1/2 text-[8px] px-1.5 pointer-events-none" />
            </button>
        </Tooltip>
    );
};

export default ReportButton;

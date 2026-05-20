import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useColibriOpen } from '@hooks/useColibriOpen';

const IS_NON_PROD = ['dev', 'beta'].includes(import.meta.env.VITE_APP_ENV);


const ReportButton = ({
    variant = 'floating',
    extraContext,
    label = 'Reportar',
    className = '',
}) => {
    const open = useColibriOpen();
    if (!IS_NON_PROD) return null;
    const handleClick = (e) => {
        e?.stopPropagation?.();
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
                className={`w-7 h-7 md:w-6 md:h-6 rounded-full bg-white flex items-center justify-center text-[#6E7477] hover:text-[#8936AB] shadow-[0px_2px_4px_0px_rgba(0,0,0,0.10)] transition-colors ${className}`}
            >
                <Icon name="bug" className="w-3.5 h-3.5 md:w-3 md:h-3" />
            </button>
        </Tooltip>
    );
};

export default ReportButton;

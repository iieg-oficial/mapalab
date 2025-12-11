import Icon from './Icon';

const Alert = ({
    severity = 'info',
    title,
    message,
    iconSrc,
    onClose,
    closeButtonLabel = 'Cerrar',
    className = ''
}) => {
    const severityStyles = {
        info: {
            container: 'bg-blue-50  ring-blue-200',
            title: 'text-blue-900',
            message: 'text-blue-700',
            button: 'text-blue-900',
            iconName: 'info'
        },
        warning: {
            container: 'bg-amber-50  ring-amber-200',
            title: 'text-amber-900',
            message: 'text-amber-700',
            button: 'text-amber-900',
            iconName: 'alert'
        },
        error: {
            container: 'bg-red-50  ring-red-200',
            title: 'text-red-900',
            message: 'text-red-700',
            button: 'text-red-900',
            iconName: 'close'
        },
        success: {
            container: 'bg-green-50  ring-green-200',
            title: 'text-green-900',
            message: 'text-green-700',
            button: 'text-green-900',
            iconName: 'check'
        }
    };

    const styles = severityStyles[severity] || severityStyles.info;

    return (
        <div className={`rounded-md shadow-lg ${styles.container} ring-1 p-4 ${className}`}>
            <div className="flex items-start gap-3">
                {iconSrc ? (
                    <img src={iconSrc} alt={severity} className="w-6 h-6 shrink-0" />
                ) : (
                    <div className="w-6 h-6 shrink-0">
                        <Icon name={styles.iconName} className="w-full h-full" />
                    </div>
                )}
                <div className="flex-1">
                    {title && (
                        <h3 className={`text-sm font-semibold ${styles.title} mb-1`}>
                            {title}
                        </h3>
                    )}
                    {message && (
                        <p className={`text-xs ${styles.message} ${onClose ? 'mb-3' : ''}`}>
                            {message}
                        </p>
                    )}
                    {onClose && (
                        <button
                            onClick={onClose}
                            className={`text-xs ${styles.button} hover:underline font-medium`}
                        >
                            {closeButtonLabel}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Alert;

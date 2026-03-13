import Icon from './Icon';

const variantStyles = {
    warning: {
        border: 'border-[#FF8300]',
        accent: 'bg-[#FF8300]',
        title: 'text-[#FF8300]',
        message: 'text-[#465055]',
        defaultIcon: 'rendimiento',
    },
    info: {
        border: 'border-[#5C2472]',
        accent: 'bg-[#5C2472]',
        title: 'text-[#465055]',
        message: 'text-[#465055]',
        defaultIcon: 'tiempo_alert',
    },
};

const Message = ({
    variant = 'info',
    title,
    description,
    icon,
    className = '',
}) => {
    const styles = variantStyles[variant] || variantStyles.info;
    const iconName = icon || styles.defaultIcon;

    return (
        <div className={`flex rounded-xl bg-white overflow-hidden ${className}`}>
            <div className="flex items-center gap-3 px-4 py-3">
                <Icon name={iconName} className="size-10 shrink-0" />
                <div className="min-w-0">
                    {title && (
                        <p className={`text-[14px] font-garet font-extrabold ${styles.title} tracking-normal`}>
                            {title}
                        </p>
                    )}
                    {description && (
                        <p className="text-[12px] font-garet font-medium text-[#465055] tracking-normal">
                            {description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Message;

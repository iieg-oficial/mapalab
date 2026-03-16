import { useState } from 'react';
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
    closable = false,
    storageKey,
}) => {
    const sessionKey = storageKey ? `message_closed_${storageKey}` : null;
    const [closed, setClosed] = useState(() => {
        if (!closable || !sessionKey) return false;
        return sessionStorage.getItem(sessionKey) === '1';
    });

    const styles = variantStyles[variant] || variantStyles.info;
    const iconName = icon || styles.defaultIcon;

    if (closed) return null;

    const handleClose = () => {
        if (sessionKey) {
            sessionStorage.setItem(sessionKey, '1');
        }
        setClosed(true);
    };

    return (
        <div className={`flex rounded-xl bg-white overflow-hidden ${className}`}>
            <div className="flex items-center gap-3 px-4 py-3 w-full">
                <Icon name={iconName} className="size-10 shrink-0" />
                <div className="min-w-0 flex-1">
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
                {closable && (
                    <button
                        onClick={handleClose}
                        className="shrink-0 p-1 rounded-full hover:bg-[#F0F0F0] transition-colors cursor-pointer"
                    >
                        <Icon name="close" className="size-4 text-[#465055]" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Message;

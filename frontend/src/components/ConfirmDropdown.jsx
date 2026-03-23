import { useRef, useEffect } from 'react';
import Icon from '@components/Icon';

const ConfirmDropdown = ({
    open,
    onClose,
    onConfirm,
    title,
    description,
    confirmText = 'Confirmar',
    className = ''
}) => {
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) onClose?.();
        };
        if (open) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div
            ref={dropdownRef}
            className={[
                'absolute top-full mt-1 z-50 bg-white rounded-[8px] shadow-[0px_3px_24px_#00000029] w-[342px] max-w-[calc(100vw-2rem)] p-4',
                className
            ].join(' ')}
        >
            <button
                onClick={onClose}
                className="absolute top-3 right-3 cursor-pointer"
            >
                <Icon name="cerrarModal" className="size-7" />
            </button>
            <div className="flex gap-3 pr-3 pt-5">
                <Icon name="warning_dropdown" className="size-8 shrink-0" />
                <div>
                    <p className="text-[12px]/[18px] font-garet font-bold text-[#2E4372]">
                        {title}
                    </p>
                    {description && (
                        <p className="text-[12px]/[18px] font-garet font-medium text-[#2E4372]">
                            {description}
                        </p>
                    )}
                    <button
                        onClick={() => { onConfirm?.(); onClose?.(); }}
                        className="mt-3 py-[7px] px-4 rounded-[30px] bg-[#FF577D] text-white text-[12px] font-garet font-bold cursor-pointer hover:bg-[#e84d6f] transition-colors"
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDropdown;

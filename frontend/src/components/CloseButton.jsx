import { useState } from 'react';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import ConfirmDropdown from '@components/ConfirmDropdown';

const CloseButton = ({
    onConfirm,
    visible = true,
    tooltip = 'Cerrar',
    tooltipPlacement = 'right',
    confirmTitle,
    confirmDescription,
    confirmText = 'Sí, cerrar',
    confirmPlacement = 'bottom',
    confirmClassName = 'left-0',
    className = '',
    size = 'size-12.5',
    iconSize = 'size-10'
}) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!visible) return null;

    const iconState = isOpen ? 'hover' : 'normal';

    return (
        <div className="relative">
            <Tooltip content={tooltip} placement={tooltipPlacement} delay={500}>
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className={[
                        size,
                        'flex items-center justify-center rounded-full border border-transparent transition-all',
                        isOpen ? 'bg-[#FF577D]' : 'bg-[#FFE6EC] hover:border-[#FF577D] active:bg-[#FF577D]',
                        className
                    ].join(' ')}
                    aria-label={tooltip}
                >
                    <Icon name="cerrar" state={iconState} className={iconSize} />
                </button>
            </Tooltip>

            <ConfirmDropdown
                open={isOpen}
                onClose={() => setIsOpen(false)}
                onConfirm={onConfirm}
                title={confirmTitle}
                description={confirmDescription}
                confirmText={confirmText}
                placement={confirmPlacement}
                className={confirmClassName}
            />
        </div>
    );
};

export default CloseButton;

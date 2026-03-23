import { useState } from 'react';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import ConfirmDropdown from '@components/ConfirmDropdown';

const CloseButton = ({
    onConfirm,
    visible = true,
    className = ''
}) => {
    const [isOpen, setIsOpen] = useState(false);

    if (!visible) return null;

    const iconState = isOpen ? 'hover' : 'normal';

    return (
        <div className="relative">
            <Tooltip content="Cerrar herramienta de mediciones" placement="right" delay={500}>
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className={[
                        'size-12.5 flex items-center justify-center rounded-full border border-transparent transition-all',
                        isOpen ? 'bg-[#FF577D]' : 'bg-[#FFE6EC] hover:border-[#FF577D] active:bg-[#FF577D]',
                        className
                    ].join(' ')}
                    aria-label="Cerrar herramienta de mediciones"
                >
                    <Icon name="cerrar" state={iconState} className="size-10" />
                </button>
            </Tooltip>

            <ConfirmDropdown
                open={isOpen}
                onClose={() => setIsOpen(false)}
                onConfirm={onConfirm}
                title="¿Cerrar herramientas de medición?"
                description="Se eliminarán todos los trazos y anotaciones actuales. Esta acción no se puede deshacer."
                confirmText="Sí, cerrar herramientas"
                className="left-0"
            />
        </div>
    );
};

export default CloseButton;

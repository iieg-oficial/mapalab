import { useRef, useState } from 'react';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import ConfirmModal from '@components/ConfirmModal';

const CloseButton = ({
    onConfirm,
    visible = true,
    className = ''
}) => {
    const buttonRef = useRef(null);
    const [isOpen, setIsOpen] = useState(false);

    if (!visible) return null;

    const handleConfirm = () => {
        onConfirm?.();
        setIsOpen(false);
    };

    const iconState = isOpen ? 'hover' : 'normal';

    return (
        <>
            <Tooltip content="Cerrar herramienta de mediciones" placement="right" delay={500}>
                <button
                    ref={buttonRef}
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

            <ConfirmModal
                open={isOpen}
                anchorRef={buttonRef}
                onClose={() => setIsOpen(false)}
                onConfirm={handleConfirm}
                title="Cerrar herramienta de mediciones"
                confirmText="Cerrar herramienta"
            >
                <p>
                    Al cerrar la herramienta de mediciones se eliminarán todos los trazos y anotaciones actuales.
                </p>
                <p className="text-xs text-gray-500 ">
                    Esta acción no se puede deshacer.
                </p>
            </ConfirmModal>
        </>
    );
};

export default CloseButton;


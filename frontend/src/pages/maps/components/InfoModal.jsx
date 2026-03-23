import { useState, useEffect } from 'react';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import Modal from '@components/Modal';
import Body from '../../home/components/Body';
import { trackInfoOpen } from '@services/analyticsService';

const InfoModal = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (isOpen) trackInfoOpen();
    }, [isOpen]);

    return (
        <>
            <Tooltip
                content="Información"
                placement="left"
                delay={300}
            >
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="cursor-pointer h-auto"
                    aria-label="Información"
                >
                    <Icon name="info" state={isHovered ? 'hover' : 'normal'} className="size-12.5" />
                </button>
            </Tooltip>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Información de Mapalab"
                width="w-11/12 max-w-7xl"
                height="h-[98dvh] sm:h-[90vh]"
                className="bg-gray-50"
                showHeader={false}
            >
                <div className="sticky top-0 z-10 flex justify-end p-3 pointer-events-none">
                    <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        className="pointer-events-auto cursor-pointer"
                        aria-label="Cerrar"
                    >
                        <Icon name="cerrarModal" state="normal" className="size-8" />
                    </button>
                </div>
                <div className="-mt-14">
                    <Body isModal />
                </div>
            </Modal>
        </>
    );
};

export default InfoModal;

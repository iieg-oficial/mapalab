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
                    className="cursor-pointer"
                    aria-label="Información"
                >
                    <Icon name="info" state={isHovered ? 'hover' : 'normal'} className="h-12.5 w-12.5" />
                </button>
            </Tooltip>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Información de Mapalab"
                width="w-11/12 max-w-7xl"
                height="h-[90vh]"
                className="bg-gray-50"
                showHeader={false}
            >
                <div className="w-full h-full">
                    <Body />
                </div>
            </Modal>
        </>
    );
};

export default InfoModal;

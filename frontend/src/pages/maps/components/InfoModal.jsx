import { useState } from 'react';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import Modal from '@components/Modal';
import Body from '../../home/components/Body';

const InfoModal = () => {
    const [isOpen, setIsOpen] = useState(false);

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
                    className={[
                        'flex items-center justify-center rounded-lg p-2 text-sm transition',
                        isOpen
                            ? 'bg-blue-500 text-white'
                            : 'bg-black/5 text-black/70 hover:bg-black/10'
                    ].join(' ')}
                    aria-label="Información"
                >
                    <Icon name="info" />
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

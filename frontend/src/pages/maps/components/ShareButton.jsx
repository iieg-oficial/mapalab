import { useState, useEffect } from 'react';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import handleShare from '../helpers/handleShare';

const ShareButton = () => {
    const [shareMessage, setShareMessage] = useState(null);
    const [isHovered, setIsHovered] = useState(false);

    useEffect(() => {
        if (shareMessage) {
            const timer = setTimeout(() => {
                setShareMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [shareMessage]);

    return (
        <Tooltip
            content={shareMessage || 'Compartir mapa'}
            placement="left"
            delay={300}
        >
            <button
                type="button"
                onClick={() => handleShare(setShareMessage)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                className="cursor-pointer"
                aria-label="Compartir mapa"
            >
                <Icon name="shared" state={isHovered ? 'hover' : 'normal'} className="h-12.5 w-12.5"/>
            </button>
        </Tooltip>
    );
};

export default ShareButton;


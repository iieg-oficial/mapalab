import { useState, useEffect } from 'react';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import handleShare from '../helpers/handleShare';
import { trackShareMap } from '@services/analyticsService';

const ShareButton = () => {
    const [shareMessage, setShareMessage] = useState(null);
    const [isHovered, setIsHovered] = useState(false);
    
    const massage = shareMessage === '¡Enlace copiado!'
    
    useEffect(() => {
        if (shareMessage) {
            trackShareMap(massage ? 'exito' : 'error');
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
                className="cursor-pointer h-auto"
                aria-label="Compartir mapa"
            >
                <Icon
                    name={massage ? 'check' : 'shared'}
                    state={massage ? 'normal' : (isHovered ? 'hover' : 'normal')}
                    className={massage ? 'size-11' : 'size-12.5'}
                />
            </button>
        </Tooltip>
    );
};

export default ShareButton;


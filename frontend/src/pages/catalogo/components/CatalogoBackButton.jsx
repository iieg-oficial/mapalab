import { useNavigate } from 'react-router';
import Logo from '@components/Logo';
import Tooltip from '@components/Tooltip';
import { CATALOGO_RETURN_KEY } from '../useGoToCatalogo';
import { trackCatalogoBack } from '@services/analyticsService';

const ROUND_BTN = 'size-10 rounded-full bg-white shadow-[0_5px_20px_#1A26641A] flex items-center justify-center text-graphite hover:bg-purple-soft transition-colors cursor-pointer';

const CatalogoBackButton = () => {
    const navigate = useNavigate();

    const handleBack = () => {
        let target = '/mapa';
        try {
            const saved = sessionStorage.getItem(CATALOGO_RETURN_KEY);
            if (saved) target = saved;
        } catch {
            target = '/mapa';
        }
        trackCatalogoBack(target);
        navigate(target);
    };

    return (
        <div className="fixed top-4 left-4 z-20 flex flex-row items-stretch gap-2">
            <div className="bg-white rounded-[10px] shadow-[0_5px_20px_#1A26641A]">
                <Logo
                    name="mapalab"
                    type="short"
                    size="w-14 h-17"
                    onClick={() => navigate('/')}
                    tooltip="Ir al inicio del IIEG"
                    tooltipPlacement="right"
                    className="shrink-0 p-3 flex justify-center"
                />
            </div>
            <div className="flex flex-col justify-between">
                <Tooltip content="Regresar a Mapalab" placement="right" delay={200}>
                    <button type="button" onClick={handleBack} aria-label="Regresar a Mapalab" className={ROUND_BTN}>
                        <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                </Tooltip>
            </div>
        </div>
    );
};

export default CatalogoBackButton;

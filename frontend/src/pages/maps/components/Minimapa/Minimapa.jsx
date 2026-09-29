import { useIsMobile } from '@hooks/useIsMobile';
import { useMinimapa } from '@pages/maps/hooks/useMinimapa';
import MinimapaMovil from './MinimapaMovil';

const Minimapa = () => {
    const isMobile = useIsMobile();
    const { visible, lienzo } = useMinimapa(isMobile);
    if (!isMobile || !visible) return null;
    return <MinimapaMovil {...lienzo} />;
};

export default Minimapa;

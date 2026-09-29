import { useDron } from '@contexts/DronContext';
import { useSider } from '@contexts/SiderContext';
import DronInstrumentos from './DronInstrumentos';
import DronSobre from './DronSobre';
import DronMinimapa from './DronMinimapa';
import DronJoysticks from './DronJoysticks';

const DronOverlay = () => {
    const { activo } = useDron();
    const { isMobile } = useSider();
    if (!activo) return null;

    return (
        <>
            <DronSobre />
            <DronInstrumentos />
            <DronMinimapa />
            {isMobile && <DronJoysticks />}
        </>
    );
};

export default DronOverlay;

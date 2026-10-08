import { useDron } from '@contexts/DronContext';
import { useSider } from '@contexts/SiderContext';

const OcultoEnDronMovil = ({ children }) => {
    const { activo } = useDron();
    const { isMobile } = useSider();
    return <div className={activo && isMobile ? 'hidden' : 'contents'}>{children}</div>;
};

export default OcultoEnDronMovil;

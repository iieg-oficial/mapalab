import { Outlet } from 'react-router';
import MapsProvider from '@providers/MapsProvider';

const MainProvider = () => {
    return (
        <MapsProvider>
            <Outlet />
        </MapsProvider>
    );
}

export default MainProvider
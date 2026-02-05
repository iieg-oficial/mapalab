import { Outlet } from 'react-router';
import MapsProvider from '@providers/MapsProvider';
import { SearchProvider } from '@contexts/SearchContext';

const MainProvider = () => {
    return (
        <MapsProvider>
            <SearchProvider>
                <Outlet />
            </SearchProvider>
        </MapsProvider>
    );
}

export default MainProvider
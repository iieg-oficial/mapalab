import { Outlet } from 'react-router';
import { SearchProvider } from '@contexts/SearchContext';

const MainProvider = () => {
    return (
        <SearchProvider>
            <Outlet />
        </SearchProvider>
    );
}

export default MainProvider

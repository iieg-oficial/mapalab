import { Outlet } from 'react-router';
import { SearchProvider } from '@contexts/SearchContext';
import AnalyticsDebugPanel from '@components/AnalyticsDebugPanel';

const MainProvider = () => {
    return (
        <SearchProvider>
            <Outlet />
            <AnalyticsDebugPanel />
        </SearchProvider>
    );
}

export default MainProvider

import { Outlet } from 'react-router';
import { SearchProvider } from '@contexts/SearchContext';
import AnalyticsDebugPanel from '@components/AnalyticsDebugPanel';
import TestEnvModal from '@components/TestEnvModal';

const MainProvider = () => {
    return (
        <SearchProvider>
            <Outlet />
            <AnalyticsDebugPanel />
            <TestEnvModal />
        </SearchProvider>
    );
}

export default MainProvider

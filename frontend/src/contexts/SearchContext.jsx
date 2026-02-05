import { createContext, useContext, useState, useCallback } from 'react';

const SearchContext = createContext(null);

SearchContext.displayName = 'SearchContext';

export const SearchProvider = ({ children }) => {
    const [initialSearchQuery, setInitialSearchQuery] = useState('');
    const [shouldAutoOpenSearch, setShouldAutoOpenSearch] = useState(false);

    const setSearchFromUrl = useCallback((query) => {
        if (query) {
            setInitialSearchQuery(query);
            setShouldAutoOpenSearch(true);
        }
    }, []);

    const consumeInitialQuery = useCallback(() => {
        const query = initialSearchQuery;
        setInitialSearchQuery('');
        return query;
    }, [initialSearchQuery]);

    const clearAutoOpen = useCallback(() => {
        setShouldAutoOpenSearch(false);
    }, []);

    const value = {
        initialSearchQuery,
        shouldAutoOpenSearch,
        setSearchFromUrl,
        consumeInitialQuery,
        clearAutoOpen
    };

    return (
        <SearchContext.Provider value={value}>
            {children}
        </SearchContext.Provider>
    );
};

export const useSearch = () => {
    const context = useContext(SearchContext);
    if (!context) {
        throw new Error('useSearch must be used within a SearchProvider');
    }
    return context;
};

export default SearchContext;

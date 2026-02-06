import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useSearch } from '@contexts/SearchContext';
import Icon from '../../../components/Icon';

const SearchBar = ({ className = '' }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();
    const { setSearchFromUrl } = useSearch();

    const handleSearch = () => {
        if (searchTerm.trim()) {
            setSearchFromUrl(searchTerm.trim());
            navigate('/mapa');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    return (
        <div className={`w-full max-w-[603px] h-[60px] flex items-center justify-center ${className}`}>
            <input
                type="text"
                placeholder='¿Qué quieres buscar?'
                className={`
                    w-full h-full text-center rounded-[40px] bg-[#F4F1FF] transition-all pl-5
                    font-garet font-medium text-[#FF8300] text-[18px]/[47px] tracking-normal text-left 
                    outline-none
                    md:text-center md:pl-0 hover:font-bold
                `}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <button
                onClick={handleSearch}
                className={`flex items-center justify-center w-[55px] h-[44px] bg-[#FF8300] rounded-[40px] p-2 -ml-16 cursor-pointer`}
            >
                <Icon name="searchInput" className="hover:-rotate-90 transition-all" />
            </button>
        </div>
    );
};

export default SearchBar;

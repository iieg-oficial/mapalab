import CatalogoInfoButton from './CatalogoInfoButton';
import { PANEL_SHADOW, Z_INPUT } from '../helpers/catalogoStyles';

export const SearchIcon = ({ className }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
    </svg>
);

const CatalogoSearchInput = ({ visibility, inputRef, query, onQuery, onOpen, onKeyDown }) => (
    <div className={`${visibility} ${Z_INPUT} ${PANEL_SHADOW} shrink-0 bg-white rounded-[10px] overflow-hidden`}>
        <input
            ref={inputRef}
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            onFocus={onOpen}
            onKeyDown={onKeyDown}
            placeholder="Busca una capa para verla en el mapa"
            className="w-full py-4 pl-12 pr-15.5 bg-transparent text-[13px] text-purple font-garet placeholder:text-[#191919] placeholder:opacity-70 focus:outline-none"
        />
        <div className="absolute left-0 top-0 h-full w-12 flex items-center justify-center">
            <CatalogoInfoButton />
        </div>
        <button
            type="button"
            onClick={onOpen}
            className="absolute right-0 top-0 h-full w-12.75 flex items-center justify-center text-purple hover:bg-purple-deep hover:text-white transition-colors"
            aria-label="Buscar"
        >
            <SearchIcon className="w-5 h-5" />
        </button>
    </div>
);

export default CatalogoSearchInput;

import { useEffect, useMemo, useState } from 'react';
import Icon from '@components/Icon';
import Loading from '@components/Loading';
import ScrollContainer from '@components/ScrollContainer';
import { useDebounce } from '@hooks/useDebounce';
import { HIDDEN_SCROLLBAR } from '@constants/global';
import { SCOPE_TYPES, ZMG_LABEL } from '@pages/maps/hooks/useMunicipioMode';

const normalize = (str) => String(str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const SectionHeader = ({ label, count }) => (
    <div className="px-2 pt-2 pb-1 flex items-center justify-between sticky top-0 bg-white z-10">
        <span className="text-[10px]/[12px] font-garet font-semibold uppercase tracking-wider text-purple">{label}</span>
        {count !== undefined && (
            <span className="text-[10px] font-garet text-gray-400 tabular-nums">{count}</span>
        )}
    </div>
);

const MunicipioFilterPanel = ({ municipioMode }) => {
    const {
        active,
        scope,
        allMunicipios,
        regiones,
        listLoading,
        geomLoading,
        error,
        sourceId,
        loadList,
        exit,
        setScope,
    } = municipioMode;

    const [searchQuery, setSearchQuery] = useState('');
    const debouncedQuery = useDebounce(searchQuery, 300);

    useEffect(() => {
        loadList();
    }, [loadList]);

    const q = normalize(debouncedQuery);

    const showZmg = !q || normalize('ZMG Zona Metropolitana Guadalajara').includes(q);
    const filteredRegiones = useMemo(() => (
        !q ? regiones : regiones.filter(r => normalize(r.nombre).includes(q))
    ), [regiones, q]);
    const filteredMunicipios = useMemo(() => (
        !q ? allMunicipios : allMunicipios.filter(m => normalize(m.nombre).includes(q) || String(m.clave).includes(q))
    ), [allMunicipios, q]);

    const sourceLabel = sourceId === 'inegi' ? 'INEGI' : 'IIEG';
    const isZmgActive = active && scope?.type === SCOPE_TYPES.ZMG;
    const isRegionActive = (nombre) => active && scope?.type === SCOPE_TYPES.REGION && scope.value === nombre;
    const isMunicipioActive = (clave) => active && scope?.type === SCOPE_TYPES.MUNICIPIO && String(scope.value) === String(clave);

    const handleSelectMunicipio = (clave) => setScope(SCOPE_TYPES.MUNICIPIO, String(clave));
    const handleSelectRegion = (nombre) => setScope(SCOPE_TYPES.REGION, nombre);
    const handleSelectZmg = () => setScope(SCOPE_TYPES.ZMG, ZMG_LABEL);

    const hasResults = showZmg || filteredRegiones.length > 0 || filteredMunicipios.length > 0;

    return (
        <div className={`pt-3 pb-6 px-4 w-full bg-[#F9FBFF] rounded-[14px] ${HIDDEN_SCROLLBAR}`}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="block text-[18px]/[24px] font-garet font-bold text-purple tracking-normal">
                    Vista por municipio
                </h3>
                <span className="text-[10px] font-garet text-gray-400 tracking-normal">Fuente: {sourceLabel}</span>
            </div>

            <div className="relative">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar municipio o región"
                    className="
                        w-full py-4 pl-4 border-none bg-[#EAEFFA] rounded-lg
                        text-[13px]/[19px] text-purple font-garet font-normal tracking-normal
                        placeholder:text-[#191919] placeholder:font-garet placeholder:font-normal placeholder:text-[13px]/[19px]
                        focus:outline-purple transition-colors
                    "
                />
                <button
                    type="button"
                    className="absolute right-0 top-1/2 -translate-y-1/2 h-full w-12.75 bg-purple-deep rounded-r-lg flex items-center justify-center"
                    aria-label="Buscar"
                >
                    {(listLoading || geomLoading) ? <Loading visible={true} size="w-5 h-5" border="border-2" color="border-white" /> : <Icon name="searchInput" />}
                </button>
            </div>

            {active && (
                <div className="mt-1 flex items-center justify-end gap-1">
                    <button
                        type="button"
                        onClick={exit}
                        className="px-2 py-1 text-[11px] font-garet font-semibold text-gray-600 hover:bg-gray-100 rounded-md cursor-pointer"
                    >
                        Salir del modo
                    </button>
                </div>
            )}

            {error && (
                <div className="mt-4 text-center py-3 px-2">
                    <p className="text-[13px]/[19px] font-garet font-medium text-graphite">
                        No se pudo cargar la información
                    </p>
                    <p className="text-[11px]/[16px] font-garet font-normal text-[#6E7477] mt-1 wrap-break-word">
                        {error.message || 'Error desconocido'}
                    </p>
                </div>
            )}

            <div className="relative bg-white rounded-[7px] p-2">
                <ScrollContainer className="max-h-100">
                    {!hasResults && !listLoading && (
                        <div className="text-center py-6">
                            <p className="text-[13px]/[19px] font-garet font-medium text-graphite">
                                Sin coincidencias para <span className="font-bold text-purple">"{debouncedQuery}"</span>
                            </p>
                        </div>
                    )}

                    {showZmg && (
                        <div role="radiogroup" aria-label="Zona Metropolitana">
                            <SectionHeader label="Zona Metropolitana" />
                            <button
                                type="button"
                                role="radio"
                                aria-checked={isZmgActive}
                                onClick={handleSelectZmg}
                                className={[
                                    'w-full flex items-start px-2 py-2 rounded-lg transition group cursor-pointer',
                                    isZmgActive ? 'bg-orange/10' : 'hover:bg-orange/10',
                                ].join(' ')}
                            >
                                <div className="flex-1 text-left">
                                    <div className={`text-[13px]/[19px] font-garet font-bold tracking-normal ${isZmgActive ? 'text-purple' : 'text-[#454545] group-hover:text-purple'}`}>
                                        ZMG — Zona Metropolitana de Guadalajara
                                    </div>
                                    <div className="text-[11px]/[15px] font-garet text-gray-500 mt-0.5">
                                        Guadalajara, Zapopan, Tlaquepaque, Tonalá y 5 municipios más
                                    </div>
                                </div>
                            </button>
                        </div>
                    )}

                    {filteredRegiones.length > 0 && (
                        <div role="radiogroup" aria-label="Regiones" className="mt-2">
                            <SectionHeader label="Regiones" count={filteredRegiones.length} />
                            <div className="space-y-0.5">
                                {filteredRegiones.map(item => {
                                    const checked = isRegionActive(item.nombre);
                                    return (
                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={checked}
                                            key={item.nombre}
                                            onClick={() => handleSelectRegion(item.nombre)}
                                            className={[
                                                'w-full flex items-center px-2 py-1.5 rounded-lg transition group cursor-pointer',
                                                checked ? 'bg-orange/10' : 'hover:bg-orange/10',
                                            ].join(' ')}
                                        >
                                            <span className={`text-[13px]/[19px] font-garet text-left tracking-normal flex-1 ${checked ? 'text-purple font-bold' : 'text-[#454545] group-hover:text-purple'}`}>
                                                {item.nombre}
                                            </span>
                                            <span className="text-[10px] font-garet text-gray-400 tabular-nums">{item.claves.length} mun.</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {filteredMunicipios.length > 0 && (
                        <div role="radiogroup" aria-label="Municipios" className="mt-2">
                            <SectionHeader label="Municipios" count={filteredMunicipios.length} />
                            <div className="space-y-0.5">
                                {filteredMunicipios.map(item => {
                                    const key = String(item.clave);
                                    const checked = isMunicipioActive(key);
                                    return (
                                        <button
                                            type="button"
                                            role="radio"
                                            aria-checked={checked}
                                            key={key}
                                            onClick={() => handleSelectMunicipio(key)}
                                            className={[
                                                'w-full flex items-center px-2 py-1.5 rounded-lg transition group cursor-pointer',
                                                checked ? 'bg-orange/10' : 'hover:bg-orange/10',
                                            ].join(' ')}
                                        >
                                            <span className={`text-[13px]/[19px] font-garet text-left tracking-normal flex-1 ${checked ? 'text-purple font-bold' : 'text-[#454545] group-hover:text-purple'}`}>
                                                {item.nombre}
                                            </span>
                                            <span className="text-[10px] font-garet text-gray-400 tabular-nums">{key}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </ScrollContainer>
            </div>
        </div>
    );
};

export default MunicipioFilterPanel;

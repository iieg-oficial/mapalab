import { useEffect, useMemo, useRef, useState } from 'react';
import Icon from '@components/Icon';
import Loading from '@components/Loading';
import ScrollContainer from '@components/ScrollContainer';
import { useDebounce } from '@hooks/useDebounce';
import { SCOPE_TYPES, ZMG_LABEL } from '@pages/maps/hooks/useMunicipioMode';

const TABS = [
    { id: SCOPE_TYPES.MUNICIPIO, label: 'Municipios', titulo: 'Vista por municipio' },
    { id: SCOPE_TYPES.REGION, label: 'Regiones', titulo: 'Vista por región' },
    { id: SCOPE_TYPES.ZMG, label: 'ZMG', titulo: 'Vista por zona metropolitana' },
];

const normalize = (str) => String(str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

const Opcion = ({ label, detalle, meta, checked, onSelect, onQuitar, itemRef, multilinea = false }) => (
    <div
        ref={itemRef}
        className={[
            'w-full flex items-center gap-1 rounded-lg transition group',
            checked
                ? 'sticky top-0 bottom-0 z-10 bg-[#FFF3E6] shadow-[0_2px_8px_#1A26641A]'
                : 'hover:bg-orange/10',
        ].join(' ')}
    >
        <button
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={onSelect}
            className="flex-1 min-w-0 flex items-center gap-2 px-2 py-1.5 text-left cursor-pointer"
        >
            <span className="flex-1 min-w-0">
                <span className={`block text-[13px]/[19px] font-garet tracking-normal ${multilinea ? '' : 'truncate'} ${checked ? 'text-purple font-bold' : 'text-[#454545] group-hover:text-purple'}`}>
                    {label}
                </span>
                {detalle && (
                    <span className={`block text-[11px]/[15px] font-garet text-gray-500 mt-0.5 ${multilinea ? '' : 'truncate'}`}>{detalle}</span>
                )}
            </span>
            {meta && !checked && (
                <span className="text-[10px] font-garet text-gray-400 tabular-nums shrink-0">{meta}</span>
            )}
        </button>
        {checked && (
            <button
                type="button"
                onClick={onQuitar}
                className="mr-1 size-6 shrink-0 flex items-center justify-center rounded-full text-purple hover:bg-purple hover:text-white transition cursor-pointer"
                aria-label={`Quitar el filtro de ${label}`}
            >
                <Icon name="close" className="size-3.5" />
            </button>
        )}
    </div>
);

const MunicipioFilterPanel = ({ municipioMode, onClose }) => {
    const {
        active, scope, allMunicipios, regiones,
        listLoading, geomLoading, error, loadList, exit, setScope,
    } = municipioMode;

    const [searchQuery, setSearchQuery] = useState('');
    const [tab, setTab] = useState(() => (
        active && scope?.type ? scope.type : SCOPE_TYPES.MUNICIPIO
    ));
    const debouncedQuery = useDebounce(searchQuery, 300);
    const seleccionadoRef = useRef(null);

    useEffect(() => {
        loadList();
    }, [loadList]);

    useEffect(() => {
        if (!seleccionadoRef.current) return;
        seleccionadoRef.current.scrollIntoView({ block: 'center' });
    }, [allMunicipios, regiones, tab]);

    const q = normalize(debouncedQuery);

    const filteredRegiones = useMemo(() => (
        !q ? regiones : regiones.filter(r => normalize(r.nombre).includes(q))
    ), [regiones, q]);
    const filteredMunicipios = useMemo(() => (
        !q ? allMunicipios : allMunicipios.filter(m => normalize(m.nombre).includes(q) || String(m.clave).includes(q))
    ), [allMunicipios, q]);

    const esActivo = (tipo, valor) => active && scope?.type === tipo && String(scope.value) === String(valor);

    const alternar = (tipo, valor) => {
        if (esActivo(tipo, valor)) {
            exit();
            return;
        }
        setScope(tipo, valor);
    };

    const opciones = useMemo(() => {
        if (tab === SCOPE_TYPES.ZMG) {
            return [{
                key: ZMG_LABEL,
                label: 'ZMG — Zona Metropolitana de Guadalajara',
                detalle: 'Guadalajara, Zapopan, Tlaquepaque, Tonalá y 5 municipios más',
                valor: ZMG_LABEL,
            }];
        }
        if (tab === SCOPE_TYPES.REGION) {
            return filteredRegiones.map(r => ({
                key: r.nombre, label: r.nombre, meta: `${r.claves.length} mun.`, valor: r.nombre,
            }));
        }
        return filteredMunicipios.map(m => ({
            key: String(m.clave), label: m.nombre, meta: String(m.clave), valor: String(m.clave),
        }));
    }, [tab, filteredRegiones, filteredMunicipios]);

    const buscable = tab !== SCOPE_TYPES.ZMG;

    return (
        <div className="flex flex-1 flex-col min-h-0 pb-3 px-4 w-full bg-[#F9FBFF] rounded-[14px]">
            <div className="shrink-0 bg-[#F9FBFF] pt-3 pb-3 rounded-t-[14px]">
                <div className="flex items-center justify-between mb-3 gap-2">
                    <h3 className="block text-[18px]/[24px] font-garet font-bold text-purple tracking-normal">
                        {TABS.find(t => t.id === tab)?.titulo}
                    </h3>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="size-7 shrink-0 flex items-center justify-center rounded-full text-purple hover:bg-purple hover:text-white transition cursor-pointer"
                            aria-label="Cerrar el selector"
                        >
                            <Icon name="close" className="size-4" />
                        </button>
                    )}
                </div>

                {buscable && (
                    <div className="relative mb-3">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={tab === SCOPE_TYPES.REGION ? 'Buscar región' : 'Buscar municipio'}
                            className="
                            w-full py-4 pl-4 pr-14 border-none bg-[#EAEFFA] rounded-lg
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
                            {(listLoading || geomLoading)
                                ? <Loading visible={true} size="w-5 h-5" border="border-2" color="border-white" />
                                : <Icon name="searchInput" />}
                        </button>
                    </div>
                )}

                <div role="tablist" aria-label="Tipo de selección" className="flex gap-1 p-1 bg-[#EAEFFA] rounded-lg">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            type="button"
                            role="tab"
                            aria-selected={tab === t.id}
                            onClick={() => setTab(t.id)}
                            className={[
                                'flex-1 py-1.5 rounded-md text-[12px]/[16px] font-garet font-bold transition cursor-pointer',
                                tab === t.id ? 'bg-white text-purple shadow-sm' : 'text-[#6E7477] hover:text-purple',
                            ].join(' ')}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="mb-3 text-center py-3 px-2">
                    <p className="text-[13px]/[19px] font-garet font-medium text-graphite">
                        No se pudo cargar la información
                    </p>
                    <p className="text-[11px]/[16px] font-garet font-normal text-[#6E7477] mt-1 wrap-break-word">
                        {error.message || 'Error desconocido'}
                    </p>
                </div>
            )}

            <div className="relative flex flex-1 min-h-0 bg-white rounded-[7px] p-2">
                <ScrollContainer className="flex-1 min-h-0" showMask={false}>
                    {opciones.length === 0 && !listLoading && (
                        <div className="text-center py-6">
                            <p className="text-[13px]/[19px] font-garet font-medium text-graphite">
                                Sin coincidencias para <span className="font-bold text-purple">&quot;{debouncedQuery}&quot;</span>
                            </p>
                        </div>
                    )}
                    <div role="radiogroup" aria-label={TABS.find(t => t.id === tab)?.label} className="space-y-0.5">
                        {opciones.map(op => {
                            const checked = esActivo(tab, op.valor);
                            return (
                                <Opcion
                                    key={op.key}
                                    label={op.label}
                                    detalle={op.detalle}
                                    meta={op.meta}
                                    checked={checked}
                                    itemRef={checked ? seleccionadoRef : null}
                                    multilinea={tab === SCOPE_TYPES.ZMG}
                                    onSelect={() => alternar(tab, op.valor)}
                                    onQuitar={exit}
                                />
                            );
                        })}
                    </div>
                </ScrollContainer>
            </div>
        </div>
    );
};

export default MunicipioFilterPanel;

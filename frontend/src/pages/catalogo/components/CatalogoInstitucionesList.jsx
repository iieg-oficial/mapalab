import ScrollContainer from '@components/ScrollContainer';
import logoMapalabShort from '@logos/mapalab_short.svg';
import { PANEL_SHADOW, Z_INSTITUCIONES } from '../helpers/catalogoStyles';

const ITEM = 'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors';
const AVATAR = 'size-9 shrink-0 rounded-md flex items-center justify-center';

const InstitucionLogo = ({ institucion }) => {
    if (institucion?.logoUrl) {
        return (
            <img
                src={institucion.logoUrl}
                alt=""
                className={`${AVATAR} object-contain bg-[#F7F7F7]`}
            />
        );
    }
    const inicial = (institucion?.nombre || '?').trim().charAt(0).toUpperCase();
    return (
        <span className={`${AVATAR} bg-orange/10 text-orange font-garet font-bold text-[15px]`}>
            {inicial}
        </span>
    );
};

const CatalogoInstitucionesList = ({
    instituciones,
    institucionActiva,
    conteos = {},
    totalCapas = 0,
    onSelect,
}) => (
    <div className={`${Z_INSTITUCIONES} ${PANEL_SHADOW} mb-4 bg-white rounded-xl overflow-hidden`}>
        <ScrollContainer
            className="max-h-[45vh] p-1.5 flex flex-col gap-1.5"
            overlayFade
            overlayColor="#FFFFFF"
            itemCount={instituciones.length + 1}
        >
            <button
                type="button"
                onClick={() => onSelect(null)}
                aria-pressed={!institucionActiva}
                className={`${ITEM} ${!institucionActiva ? 'bg-purple-soft' : 'hover:bg-purple-soft/60'}`}
            >
                <img src={logoMapalabShort} alt="" className={`${AVATAR} object-contain p-0.5`} />
                <span className="min-w-0 flex-1 font-garet text-[15px] font-bold text-purple truncate">
                    Todas
                </span>
                <span className="shrink-0 font-garet text-[12px] text-[#6E7477]">
                    {totalCapas}
                </span>
            </button>

            {instituciones.map((institucion) => {
                const activa = institucionActiva?.slug === institucion.slug;
                return (
                    <button
                        key={institucion.slug}
                        type="button"
                        onClick={() => onSelect(institucion.slug)}
                        aria-pressed={activa}
                        className={`${ITEM} ${activa ? 'bg-orange/15' : 'hover:bg-orange/10'}`}
                    >
                        <InstitucionLogo institucion={institucion} />
                        <span className={`min-w-0 flex-1 font-garet text-[15px] font-bold truncate ${activa ? 'text-orange' : 'text-[#454545]'}`}>
                            {institucion.nombre}
                        </span>
                        <span className="shrink-0 font-garet text-[12px] text-[#6E7477]">
                            {conteos[institucion.slug] || 0}
                        </span>
                    </button>
                );
            })}
        </ScrollContainer>
    </div>
);

export default CatalogoInstitucionesList;

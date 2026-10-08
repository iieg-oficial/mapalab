import Segmented from '@components/Segmented';
import Badge from '@components/Badge';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import Loading from '@components/Loading';
import HexbinLegend from '@pages/maps/components/ActiveLayers/HexbinLegend';
import { legendEntries } from '@pages/maps/helpers/hexbinStyles';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { VISTA_HEXAGONOS, VISTA_PUNTOS } from '../helpers/catalogoVista';

const OPCIONES = [
    { value: VISTA_PUNTOS, label: 'Puntos', icon: 'geom_point', tooltip: 'Ver los puntos' },
    { value: VISTA_HEXAGONOS, label: 'Hexágonos', icon: 'geom_hexbin', tooltip: 'Agrupar en hexágonos' },
];

const NOTA = 'font-garet text-[11px]/[16px] text-[#6E7477] px-1';

const AVISOS_3D = {
    loading: 'Levantando la capa…',
    too_large: 'La capa tiene demasiados elementos para levantarla en 3D',
    error: 'No se pudo levantar la capa',
    no_value: 'La capa no tiene un campo numérico para levantar',
};

const textoExtrusion = ({ on, status, en3d }) => {
    if (!en3d) return 'Ver en 3D y levantar la capa';
    if (on && AVISOS_3D[status]) return AVISOS_3D[status];
    return on ? 'Aplanar la capa' : 'Levantar la capa en 3D';
};

const CatalogoExtruir = ({ extrusion }) => {
    const texto = textoExtrusion(extrusion);
    return (
        <Tooltip content={texto} placement="bottom" delay={300}>
            <button
                type="button"
                onClick={extrusion.alternar}
                aria-pressed={extrusion.on}
                aria-label={texto}
                className={`size-8 shrink-0 rounded-full flex items-center justify-center transition-colors cursor-pointer ${extrusion.on
                    ? 'bg-purple-deep text-white'
                    : 'bg-[#EEF0F2] text-graphite hover:bg-purple-soft hover:text-purple'}`}
            >
                {extrusion.on && extrusion.status === 'loading'
                    ? <Loading visible size="size-4" border="border-2" color="border-white" />
                    : <Icon name="cubo" className="size-5" />}
            </button>
        </Tooltip>
    );
};

export const CatalogoVistaSegmented = ({ nombre, vista, onVista = null, celdas = null, extrusion = null }) => (
    <div className="flex items-center gap-2 mb-2.5">
        {onVista && (
            <Tooltip
                content={(
                    <div className="flex flex-col gap-0.5 leading-tight max-w-[220px]">
                        <span className="font-semibold">Ver como puntos o hexágonos</span>
                        <span className="text-[11px] opacity-80">Hexágonos agrupa los puntos en celdas y las colorea por cuántos caen en cada una.</span>
                    </div>
                )}
                placement="bottom"
            >
                <span className="relative inline-flex shrink-0">
                    <Segmented
                        compact
                        variant="gris"
                        ariaLabel={`Forma de ver ${nombre}`}
                        options={OPCIONES}
                        value={vista}
                        onChange={onVista}
                    />
                    <Badge variant="pill" color="orange" text="BETA" className="absolute -top-2 -right-2 text-[8px] px-1.5" />
                </span>
            </Tooltip>
        )}
        {extrusion && <CatalogoExtruir extrusion={extrusion} />}
        {onVista && celdas !== null && (
            <span className="font-garet text-[12px] text-[#6E7477] tabular-nums">{`${formatNumber(celdas)} celdas`}</span>
        )}
    </div>
);

export const CatalogoHexbinLeyenda = ({ hexbin }) => {
    if (!hexbin || hexbin.estado === 'cargando') return <p className={NOTA}>Agrupando los puntos…</p>;
    if (hexbin.estado === 'demasiados') {
        return (
            <p className={NOTA}>
                {`Tiene ${formatNumber(hexbin.total)} puntos y el máximo son ${formatNumber(hexbin.limite)}. Filtra por año para verla en hexágonos.`}
            </p>
        );
    }
    if (hexbin.estado === 'error') return <p className={NOTA}>No se pudieron traer los puntos.</p>;
    const { breaks, max, paletteIndex } = hexbin.stats || {};
    if (!max) return <p className={NOTA}>Sin puntos en esta vista.</p>;
    return (
        <div className="w-full bg-white rounded-[13px] overflow-hidden">
            <HexbinLegend entries={legendEntries(breaks, max, paletteIndex)} />
        </div>
    );
};

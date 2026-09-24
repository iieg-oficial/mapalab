import Segmented from '@components/Segmented';
import Badge from '@components/Badge';
import Tooltip from '@components/Tooltip';
import HexbinLegend from '@pages/maps/components/ActiveLayers/HexbinLegend';
import { legendEntries } from '@pages/maps/helpers/hexbinStyles';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { VISTA_HEXAGONOS, VISTA_PUNTOS } from '../helpers/catalogoVista';

const OPCIONES = [
    { value: VISTA_PUNTOS, label: 'Puntos', icon: 'geom_point', tooltip: 'Ver los puntos' },
    { value: VISTA_HEXAGONOS, label: 'Hexágonos', icon: 'geom_hexbin', tooltip: 'Agrupar en hexágonos' },
];

const NOTA = 'font-garet text-[11px]/[16px] text-[#6E7477] px-1';

export const CatalogoVistaSegmented = ({ nombre, vista, onVista }) => (
    <div className="flex items-center gap-2 mb-2.5">
        <span className="font-garet text-[12px] text-[#6E7477]">Ver como</span>
        <Tooltip content="Hexágonos agrupa los puntos en celdas y las colorea por cuántos caen en cada una." placement="bottom">
            <span className="relative inline-flex">
                <Segmented
                    compact
                    ariaLabel={`Forma de ver ${nombre}`}
                    options={OPCIONES}
                    value={vista}
                    onChange={onVista}
                />
                <Badge variant="pill" color="orange" text="BETA" className="absolute -top-2 -right-2 text-[8px] px-1.5" />
            </span>
        </Tooltip>
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
    const { breaks, max, paletteIndex, cells } = hexbin.stats || {};
    if (!max) return <p className={NOTA}>Sin puntos en esta vista.</p>;
    return (
        <div className="w-full bg-white rounded-[13px] overflow-hidden">
            <HexbinLegend entries={legendEntries(breaks, max, paletteIndex)} />
            <p className={`${NOTA} pb-1`}>{`Puntos por hexágono · ${formatNumber(cells)} celdas`}</p>
        </div>
    );
};

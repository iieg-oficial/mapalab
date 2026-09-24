import Switch from '@components/Switch';
import Icon from '@components/Icon';
import Badge from '@components/Badge';
import Tooltip from '@components/Tooltip';
import HexbinLegend from '@pages/maps/components/ActiveLayers/HexbinLegend';
import { legendEntries } from '@pages/maps/helpers/hexbinStyles';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import { VISTA_HEXAGONOS, VISTA_PUNTOS } from '../helpers/catalogoVista';

const NOTA = 'font-garet text-[11px]/[16px] text-[#6E7477] px-1';

export const CatalogoVistaSegmented = ({ nombre, vista, onVista }) => {
    const hexagonos = vista === VISTA_HEXAGONOS;
    return (
        <Tooltip
            content={(
                <div className="flex flex-col gap-0.5 leading-tight max-w-[220px]">
                    <span className="font-semibold">{hexagonos ? 'Viendo hexágonos' : 'Viendo puntos'}</span>
                    <span className="text-[11px] opacity-80">Hexágonos agrupa los puntos en celdas y las colorea por cuántos caen en cada una.</span>
                </div>
            )}
            placement="bottom"
        >
            <span className="relative inline-flex items-center gap-1 shrink-0">
                <Icon name="geom_point" className={`size-3.5 ${hexagonos ? 'opacity-40' : ''}`} />
                <Switch
                    variant="neutro"
                    checked={hexagonos}
                    onChange={(activo) => onVista(activo ? VISTA_HEXAGONOS : VISTA_PUNTOS)}
                    ariaLabel={`Ver ${nombre} en hexágonos`}
                />
                <Icon name="geom_hexbin" className={`size-3.5 ${hexagonos ? '' : 'opacity-40'}`} />
                <Badge variant="pill" color="orange" text="BETA" className="absolute -top-3 -right-2 text-[8px] px-1.5" />
            </span>
        </Tooltip>
    );
};

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

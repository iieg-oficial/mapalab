import Logo from '@components/Logo';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useDecoracionEvento } from '@hooks/useEvento';
import { esDiaDeMuertos } from '@pages/maps/helpers/eventoDiversion';
import RamoMaravillas from './RamoMaravillas';
import { RAMO_CONTRAIDO, RAMO_EXPANDIDO } from './ramos';

const LogoIieg = ({ isExpanded, visible, onClick }) => {
    const decoracion = useDecoracionEvento();
    const conRamo = visible && esDiaDeMuertos(decoracion);
    const ramoSobreLogo = conRamo && isExpanded;
    const relleno = conRamo ? (isExpanded ? RAMO_EXPANDIDO : RAMO_CONTRAIDO).relleno : '';

    return (
        <div className={`relative w-full shrink-0 ${relleno}`}>
            <Logo
                name="iieg"
                size={isExpanded ? 'w-41 h-13' : 'w-12 h-13'}
                expanded={isExpanded}
                visible={visible}
                onClick={ramoSobreLogo ? null : onClick}
                tooltip={ramoSobreLogo ? null : 'Acerca de Mapa Lab'}
                tooltipPlacement="top"
                className="shrink-0 p-3 my-2 w-full"
            />
            {conRamo && <RamoMaravillas expandido={isExpanded} />}
            {ramoSobreLogo && (
                <div className="absolute right-0 top-11.5 translate-x-1/2 -translate-y-1/2 z-10">
                    <Tooltip content="Acerca de Mapa Lab" placement="right">
                        <button
                            type="button"
                            onClick={onClick}
                            aria-label="Acerca de Mapa Lab"
                            className="size-7 rounded-full bg-white shadow-[0_5px_20px_#1A26641A] flex items-center justify-center cursor-pointer hover:scale-110 transition-transform"
                        >
                            <Icon name="info" className="size-4" />
                        </button>
                    </Tooltip>
                </div>
            )}
        </div>
    );
};

export default LogoIieg;

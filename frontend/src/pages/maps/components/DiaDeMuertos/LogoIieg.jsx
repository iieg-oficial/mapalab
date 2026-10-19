import Logo from '@components/Logo';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useDecoracionEvento } from '@hooks/useEvento';
import { esDiaDeMuertos } from '@pages/maps/helpers/eventoDiversion';
import ArregloFloral from './ArregloFloral';

const LogoIieg = ({ isExpanded, visible, onClick }) => {
    const decoracion = useDecoracionEvento();
    const conArreglo = visible && esDiaDeMuertos(decoracion);

    return (
        <div className="relative w-full shrink-0 flex flex-col">
            {conArreglo && <ArregloFloral expandido={isExpanded} />}
            <Logo
                name="iieg"
                size={isExpanded ? 'w-41 h-13' : 'w-12 h-13'}
                expanded={isExpanded}
                visible={visible}
                onClick={conArreglo ? null : onClick}
                tooltip={conArreglo ? null : 'Acerca de Mapa Lab'}
                tooltipPlacement="top"
                className={`shrink-0 p-3 my-2 w-full ${conArreglo ? 'relative z-10 pointer-events-none [&_img]:pointer-events-auto' : ''}`}
            />
            {conArreglo && (
                <div data-sider-nohover className="absolute right-0 top-11.5 translate-x-1/2 -translate-y-1/2 z-20">
                    <Tooltip content="Acerca de Mapa Lab" placement="right">
                        <button
                            type="button"
                            onClick={onClick}
                            aria-label="Acerca de Mapa Lab"
                            className="size-5 rounded-full bg-white flex items-center justify-center shadow-[0_5px_20px_#1A26641A] cursor-pointer text-graphite"
                        >
                            <Icon name="chevron" className="size-3 -rotate-90" />
                        </button>
                    </Tooltip>
                </div>
            )}
        </div>
    );
};

export default LogoIieg;

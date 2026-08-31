import { useIsMobile } from '@hooks/useIsMobile';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';
import BarraEstado from './BarraEstado';
import Ventana from './Ventana';

const TablaAtributos = () => {
    const { activo, tablas, activaId, minimizado } = useTablaAtributos();
    const isMobile = useIsMobile();

    if (!activo || tablas.length === 0) return null;

    return (
        <>
            {tablas.map((capa, indice) => (
                <Ventana
                    key={capa.id}
                    layerId={capa.id}
                    indice={indice}
                    activa={capa.id === activaId}
                    minimizada={minimizado || capa.id !== activaId}
                    esMovil={isMobile}
                />
            ))}
            {minimizado && <BarraEstado />}
        </>
    );
};

export default TablaAtributos;

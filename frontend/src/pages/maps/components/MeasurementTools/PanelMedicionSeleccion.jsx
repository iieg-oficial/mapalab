import { useContext } from 'react';
import MapsContext from '@contexts/MapsContext';
import { useResultadoMedicion } from '@hooksMaps/useResultadoMedicion';
import PanelMedicion from './PanelMedicion';

const PanelMedicionSeleccion = ({ geometria, onCerrar, className = '' }) => {
    const { measurementConfig } = useContext(MapsContext) || {};
    const medicion = useResultadoMedicion(geometria);
    if (!medicion.visible) return null;
    return (
        <PanelMedicion
            modo={medicion.modo}
            resultado={medicion.resultado}
            unidades={measurementConfig}
            onCerrar={onCerrar || medicion.cerrar}
            ancho="w-full"
            arrastrable={false}
            className={className}
        />
    );
};

export default PanelMedicionSeleccion;

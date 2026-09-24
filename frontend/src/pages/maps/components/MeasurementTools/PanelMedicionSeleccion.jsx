import { useResultadoMedicion } from '@hooksMaps/useResultadoMedicion';
import PanelMedicion from './PanelMedicion';

const PanelMedicionSeleccion = ({ geometria, className = '' }) => {
    const medicion = useResultadoMedicion(geometria);
    if (!medicion.visible) return null;
    return (
        <PanelMedicion
            modo={medicion.modo}
            resultado={medicion.resultado}
            onCerrar={medicion.cerrar}
            ancho="w-full"
            className={className}
        />
    );
};

export default PanelMedicionSeleccion;

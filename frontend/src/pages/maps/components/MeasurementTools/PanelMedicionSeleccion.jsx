import { useResultadoMedicion } from '@hooksMaps/useResultadoMedicion';
import PanelMedicion from './PanelMedicion';

const PanelMedicionSeleccion = ({ geometria, onCerrar, className = '' }) => {
    const medicion = useResultadoMedicion(geometria);
    if (!medicion.visible) return null;
    return (
        <PanelMedicion
            modo={medicion.modo}
            resultado={medicion.resultado}
            onCerrar={onCerrar || medicion.cerrar}
            ancho="w-full"
            arrastrable={false}
            className={className}
        />
    );
};

export default PanelMedicionSeleccion;

import PillMinimizada from '@components/PillMinimizada';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';

const conteoLegible = (conteo) => (Number.isFinite(conteo) ? conteo.toLocaleString('es-MX') : '…');

const PestanasTablas = ({ nombreDe, tamano = 'compacta' }) => {
    const { tablas, activaId, activar, cerrar, estadoDe } = useTablaAtributos();

    if (tablas.length === 0) return null;

    return (
        <div className="flex items-center gap-2 min-w-0 overflow-x-auto scrollbar-thin py-0.5">
            {tablas.map(layerId => {
                const nombre = nombreDe(layerId);
                return (
                    <PillMinimizada
                        key={layerId}
                        etiqueta={nombre}
                        icono="tabla"
                        sufijo={conteoLegible(estadoDe(layerId).conteo)}
                        activa={layerId === activaId}
                        tamano={tamano}
                        cierreDentro
                        tooltipAbrir={`Ver los datos de ${nombre}`}
                        tooltipCerrar={`Quitar la tabla de ${nombre}`}
                        ariaAbrir={`Ver los datos de ${nombre}`}
                        ariaCerrar={`Quitar la tabla de ${nombre}`}
                        onAbrir={() => activar(layerId)}
                        onCerrar={() => cerrar(layerId)}
                    />
                );
            })}
        </div>
    );
};

export default PestanasTablas;

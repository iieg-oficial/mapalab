import PillMinimizada from '@components/PillMinimizada';

const PillNumeralia = ({ nombreCapa, ...resto }) => (
    <PillMinimizada
        etiqueta={nombreCapa}
        icono="numeralia"
        ariaAbrir={`Abrir las estadísticas de ${nombreCapa}`}
        ariaCerrar="Cerrar el panel de estadísticas"
        {...resto}
    />
);

export default PillNumeralia;

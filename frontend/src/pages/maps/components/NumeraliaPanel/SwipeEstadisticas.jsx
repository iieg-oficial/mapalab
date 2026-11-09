import { useSider } from '@contexts/SiderContext';
import { useNumeraliaRanking } from '@hooksMaps/useNumeraliaRanking';
import { useRepartoBarra } from '@hooksMaps/useRepartoBarra';
import { useRayadoBarra } from '@hooksMaps/useRayadoBarra';
import CifrasBarra from './CifrasBarra';

const SwipeEstadisticas = ({ layerId, metadata, contextos }) => {
    const { isMobile } = useSider();
    const { reparto, municipios, mapas, permitidos } = useRepartoBarra(true, contextos.A?.claves);
    const { ranking: rankingA, cargando: cargandoA } = useNumeraliaRanking(layerId, true, contextos.A);
    const { ranking: rankingB, cargando: cargandoB } = useNumeraliaRanking(layerId, true, contextos.B);
    useRayadoBarra(mapas, municipios, reparto);

    return (
        <CifrasBarra
            layerId={layerId}
            titulo={metadata?.nombre_capa_usuario || 'Estadísticas'}
            ambito={metadata?.ambito?.geografico || 'Jalisco'}
            rankingA={rankingA}
            rankingB={rankingB}
            reparto={reparto}
            permitidos={permitidos}
            cargando={cargandoA || cargandoB}
            movil={isMobile}
        />
    );
};

export default SwipeEstadisticas;

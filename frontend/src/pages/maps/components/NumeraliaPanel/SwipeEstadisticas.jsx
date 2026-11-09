import { useSider } from '@contexts/SiderContext';
import { useNumeraliaRanking } from '@hooksMaps/useNumeraliaRanking';
import { useRepartoBarra } from '@hooksMaps/useRepartoBarra';
import { useRayadoBarra } from '@hooksMaps/useRayadoBarra';
import CifrasBarra from './CifrasBarra';

const tituloDe = (metadata) => metadata?.nombre_capa_usuario || 'Estadísticas';

const SwipeEstadisticas = ({ layerId, lado, metadata, capaOtra, contextos }) => {
    const { isMobile } = useSider();
    const capas = capaOtra
        ? {
            [lado]: { layerId, titulo: tituloDe(metadata), contexto: contextos[lado] },
            [capaOtra.lado]: { layerId: capaOtra.id, titulo: tituloDe(capaOtra.metadata), contexto: capaOtra.contexto },
        }
        : {
            A: { layerId, titulo: tituloDe(metadata), contexto: contextos.A },
            B: { layerId, titulo: tituloDe(metadata), contexto: contextos.B },
        };
    const { reparto, municipios, mapas, permitidos } = useRepartoBarra(true, contextos.A?.claves);
    const { ranking: rankingA, cargando: cargandoA } = useNumeraliaRanking(capas.A.layerId, true, capas.A.contexto);
    const { ranking: rankingB, cargando: cargandoB } = useNumeraliaRanking(capas.B.layerId, true, capas.B.contexto);
    useRayadoBarra(mapas, municipios, reparto);

    return (
        <CifrasBarra
            capas={capas}
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

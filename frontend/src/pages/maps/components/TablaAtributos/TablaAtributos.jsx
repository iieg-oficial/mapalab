import { useRef } from 'react';
import { useIsMobile } from '@hooks/useIsMobile';
import { useClearance } from '@hooks/useClearance';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import { useTablaAtributos } from '@contexts/TablaAtributosContext';
import { useBordeDerecho } from '@hooksMaps/useBordeDerecho';
import { PANEL_GAP, VIEWPORT_EDGE } from '@pages/maps/helpers/mapFit';
import BarraEstado from './BarraEstado';
import Ventana from './Ventana';

const CONTROLES_DEL_MAPA = ['.ol-scale-line', '.ol-attribution'];
const ALTO_BARRA = 120;

const TablaAtributos = () => {
    const { activo, tablas, activaId, minimizado } = useTablaAtributos();
    const isMobile = useIsMobile();
    const { leftPosition, className: transicionSider } = useSiderAdaptivePosition({ bottomOffset: ALTO_BARRA });
    const barraRef = useRef(null);

    const inferior = useClearance(barraRef, {
        lado: 'bottom',
        obstaculos: CONTROLES_DEL_MAPA,
        base: isMobile ? 68 : 12,
        separacion: 8,
        activo: minimizado && tablas.length > 0,
    });

    const bordeControles = useBordeDerecho('[data-controles-mapa]', {
        base: leftPosition,
        activo: minimizado && !isMobile,
    });

    if (!activo || tablas.length === 0) return null;

    const izquierda = isMobile ? VIEWPORT_EDGE : bordeControles + PANEL_GAP;
    const derecha = isMobile ? VIEWPORT_EDGE : VIEWPORT_EDGE + PANEL_GAP;

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
            {minimizado && (
                <div ref={barraRef}>
                    <BarraEstado
                        inferior={inferior}
                        izquierda={izquierda}
                        derecha={derecha}
                        transicion={transicionSider}
                    />
                </div>
            )}
        </>
    );
};

export default TablaAtributos;

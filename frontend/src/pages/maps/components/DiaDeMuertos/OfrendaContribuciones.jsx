import { useDecoracionEvento } from '@hooks/useEvento';
import { esDiaDeMuertos } from '@pages/maps/helpers/eventoDiversion';
import ArregloFloral from './ArregloFloral';
import { Calabaza, Cirio, Cocada, Jarrito, Mandarina, Mazapan, PanLado, Veladora } from './OfrendaPiezas';

const PISO = 168;
const GRADA = 10;
const ANCHO = 134;
const VISTA = '290 118 122 52';

const OfrendaContribuciones = () => {
    const decoracion = useDecoracionEvento();
    if (!esDiaDeMuertos(decoracion)) return null;

    return (
        <div
            className="pointer-events-none absolute right-0 aspect-[122/52]"
            style={{ bottom: 'calc(100% - 2px)', width: `${ANCHO}px` }}
            aria-hidden="true"
        >
            <svg viewBox={VISTA} className="absolute inset-0 size-full overflow-visible">
                <rect x={294} y={PISO - GRADA} width={88} height={GRADA} rx="1.5" fill="#7A2E8E" />
                <rect x={294} y={PISO - GRADA} width={88} height="1.6" rx="0.8" fill="#FF8300" />
            </svg>
            <ArregloFloral className="bottom-0 right-0 origin-bottom-right" style={{ transform: `scale(${ANCHO / 122})` }} />
            <svg viewBox={VISTA} className="absolute inset-0 size-full overflow-visible">
                <Cirio x={390} base={PISO - 1} alto={34} retraso={0.1} />
                <Cirio x={403} base={PISO - 1} alto={42} ancho={7} retraso={0.3} />
                <Cirio x={396} base={PISO - 1} alto={26} retraso={0.55} />
                <Veladora x={384} base={PISO} retraso={0.2} />
                <Veladora x={393} base={PISO} ancho={8} alto={11} retraso={0.7} />
                <Veladora x={402} base={PISO} retraso={0.45} />
                <Veladora x={410} base={PISO} ancho={8} alto={10} retraso={0.9} />
                <Mazapan x={300} base={PISO} ancho={8} />
                <PanLado x={312} base={PISO + 1} ancho={16} />
                <Jarrito x={326} base={PISO} ancho={11} />
                <Cocada x={336} base={PISO} ancho={8} />
                <PanLado x={346} base={PISO + 1} ancho={14} />
                <Calabaza x={357} base={PISO} ancho={8} />
                <PanLado x={367} base={PISO + 1} ancho={14} />
                <Mandarina x={377} base={PISO} radio={3.6} />
            </svg>
        </div>
    );
};

export default OfrendaContribuciones;

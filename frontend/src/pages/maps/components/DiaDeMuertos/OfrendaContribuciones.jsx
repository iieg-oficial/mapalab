import { useDecoracionEvento } from '@hooks/useEvento';
import { esDiaDeMuertos } from '@pages/maps/helpers/eventoDiversion';
import { Calabaza, Cirio, Cocada, Jarrito, Mandarina, Mazapan, PanLado, Veladora } from './OfrendaPiezas';

const PISO = 168;

const OfrendaContribuciones = () => {
    const decoracion = useDecoracionEvento();
    if (!esDiaDeMuertos(decoracion)) return null;

    return (
        <svg
            viewBox="290 118 122 52"
            className="pointer-events-none absolute right-0 w-[134px] overflow-visible"
            style={{ bottom: 'calc(100% - 2px)' }}
            aria-hidden="true"
        >
            <Cocada x={334} base={PISO - 2} ancho={8} />
            <Mazapan x={300} base={PISO} ancho={8} />
            <Cirio x={390} base={PISO - 1} alto={34} retraso={0.1} />
            <Cirio x={403} base={PISO - 1} alto={42} ancho={7} retraso={0.3} />
            <Cirio x={396} base={PISO - 1} alto={26} retraso={0.55} />
            <Veladora x={384} base={PISO} retraso={0.2} />
            <Veladora x={393} base={PISO} ancho={8} alto={11} retraso={0.7} />
            <Veladora x={402} base={PISO} retraso={0.45} />
            <Veladora x={410} base={PISO} ancho={8} alto={10} retraso={0.9} />
            <PanLado x={312} base={PISO + 1} ancho={16} />
            <Jarrito x={326} base={PISO} ancho={11} />
            <PanLado x={340} base={PISO + 1} ancho={16} />
            <Calabaza x={353} base={PISO} ancho={8} />
            <PanLado x={364} base={PISO + 1} ancho={14} />
            <Mandarina x={376} base={PISO} radio={3.6} />
        </svg>
    );
};

export default OfrendaContribuciones;

import { useRef } from 'react';
import { useDron } from '@contexts/DronContext';

const RECORRIDO = 32;

const Joystick = ({ lado, etiqueta, alMover }) => {
    const baseRef = useRef(null);
    const perillaRef = useRef(null);
    const activoRef = useRef(null);

    const mover = (e) => {
        const r = baseRef.current.getBoundingClientRect();
        let dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        let dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        const m = Math.hypot(dx, dy);
        if (m > 1) { dx /= m; dy /= m; }
        perillaRef.current.style.transform = `translate(${dx * RECORRIDO}px, ${dy * RECORRIDO}px)`;
        alMover(dx, dy);
    };
    const soltar = () => {
        activoRef.current = null;
        perillaRef.current.style.transform = '';
        alMover(0, 0);
    };

    return (
        <div
            ref={baseRef}
            role="application"
            aria-label={etiqueta}
            onPointerDown={(e) => { activoRef.current = e.pointerId; baseRef.current.setPointerCapture(e.pointerId); mover(e); }}
            onPointerMove={e => e.pointerId === activoRef.current && mover(e)}
            onPointerUp={soltar}
            onPointerCancel={soltar}
            className={`fixed bottom-28 z-20 size-26 touch-none rounded-full border border-[#5C24721F] bg-white/60 shadow-[0_5px_20px_#1A26641A] backdrop-blur-sm ${lado}`}
        >
            <div ref={perillaRef} className="absolute left-1/2 top-1/2 -ml-5.5 -mt-5.5 size-11 rounded-full bg-[#5C2472]" />
        </div>
    );
};

const DronJoysticks = () => {
    const { controlesRef, setAuto } = useDron();
    const joy = controlesRef.current.joy;
    const tomar = (x, y) => {
        if (x || y) {
            setAuto(false);
        }
    };

    return (
        <>
            <Joystick lado="left-4" etiqueta="Mover el dron" alMover={(dx, dy) => { tomar(dx, dy); joy.mx = dx; joy.mz = -dy; }} />
            <Joystick lado="right-4" etiqueta="Girar y cambiar la altura" alMover={(dx, dy) => { tomar(dx, dy); joy.giro = -dx; joy.sube = -dy; }} />
        </>
    );
};

export default DronJoysticks;

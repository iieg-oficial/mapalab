import { useEffect, useRef, useState } from 'react';
import { useDecoracionEvento } from '@hooks/useEvento';
import { esDiaDeMuertos } from '@pages/maps/helpers/eventoDiversion';
import Cempasuchil from './Cempasuchil';

const MAXIMO = 12;
const CADENCIA_MS = 8000;
const PRIMERA_MS = 500;
const DESVANECER_MS = 1600;
const POSICIONES = [3, 35, 72, 19, 54, 88, 9, 63, 27, 80, 45, 95];
const TAMANOS = ['size-3', 'size-4', 'size-5', 'size-6.5'];

const vacias = () => Array.from({ length: MAXIMO }, () => ({ gen: 0, saliendo: false }));

const Lluvia = () => {
    const [flores, setFlores] = useState(vacias);
    const turno = useRef(0);

    useEffect(() => {
        const timers = [];
        const cambiar = (i, cambio) => setFlores((prev) => prev.map((f, k) => (k === i ? { ...f, ...cambio(f) } : f)));
        const soltar = () => {
            const i = turno.current % MAXIMO;
            const ocupada = turno.current >= MAXIMO;
            turno.current += 1;
            if (!ocupada) {
                cambiar(i, (f) => ({ gen: f.gen + 1 }));
                return;
            }
            cambiar(i, () => ({ saliendo: true }));
            timers.push(setTimeout(() => cambiar(i, (f) => ({ gen: f.gen + 1, saliendo: false })), DESVANECER_MS));
        };
        timers.push(setTimeout(soltar, PRIMERA_MS));
        const intervalo = setInterval(soltar, CADENCIA_MS);
        return () => {
            clearInterval(intervalo);
            timers.forEach(clearTimeout);
        };
    }, []);

    return (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[25] overflow-hidden">
            {flores.map((f, i) => f.gen > 0 && (
                <Cempasuchil
                    key={`${i}-${f.gen}`}
                    className={`muertos-flor-cae absolute top-0 ${TAMANOS[(i + f.gen) % TAMANOS.length]} ${f.saliendo ? 'opacity-0' : ''}`}
                    style={{ left: `${POSICIONES[(i * 5 + f.gen * 7) % POSICIONES.length]}%`, '--muertos-lado': (i + f.gen) % 2 ? 1 : -1 }}
                />
            ))}
        </div>
    );
};

const LluviaCempasuchil = () => {
    const decoracion = useDecoracionEvento();
    return esDiaDeMuertos(decoracion) ? <Lluvia /> : null;
};

export default LluviaCempasuchil;

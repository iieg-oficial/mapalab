import { useDecoracionEvento } from '@hooks/useEvento';
import { esDiaDeMuertos } from '@pages/maps/helpers/eventoDiversion';
import PapelPicado from './PapelPicado';

const COLORES = ['#E4007C', '#F28C0F', '#5C2472', '#2E9E5B', '#1E88C9', '#F5B700'];
const CORDEL = [
    { x: 7.4, y: 14, r: 9 },
    { x: 22.6, y: 28, r: 6 },
    { x: 37.9, y: 34, r: 2 },
    { x: 53.2, y: 34, r: -2 },
    { x: 68.5, y: 26, r: -6 },
    { x: 83.8, y: 12, r: -9 },
];
const PILA = [
    { color: '#1E88C9', r: -7, dx: -12 },
    { color: '#2E9E5B', r: 7, dx: -6 },
    { color: '#F5B700', r: -4, dx: 6 },
    { color: '#F28C0F', r: 4, dx: 12 },
    { color: '#5C2472', r: -2, dx: 0 },
];

const Colgante = ({ children, style, ritmo }) => (
    <div className="muertos-colgante pointer-events-auto absolute origin-top" style={style}>
        <div className="muertos-bandera origin-top" style={{ animationDuration: `${ritmo.duracion}s`, animationDelay: `${ritmo.retraso}s` }}>
            {children}
        </div>
    </div>
);

const Cordel = () => (
    <div aria-hidden="true" className="pointer-events-none absolute left-0 top-full w-full h-25">
        <svg viewBox="0 0 340 60" preserveAspectRatio="none" className="absolute -top-1 left-0 w-full h-15">
            <path d="M10 4 Q170 70 330 4" stroke="#8A6F5A" strokeWidth="1.4" fill="none" vectorEffect="non-scaling-stroke" />
        </svg>
        {CORDEL.map(({ x, y, r }, i) => (
            <Colgante
                key={x}
                style={{ left: `${x}%`, top: `${y}px`, transform: `rotate(${r}deg)` }}
                ritmo={{ duracion: 5 + (i % 3) * 0.6, retraso: -i * 1.3 }}
            >
                <PapelPicado color={COLORES[i]} className="block w-9.5 h-12" />
            </Colgante>
        ))}
    </div>
);

const Pila = () => (
    <div aria-hidden="true" className="pointer-events-none absolute top-full w-19 h-15" style={{ right: '-13px' }}>
        <svg viewBox="0 0 76 12" className="absolute top-0 left-0 w-19 h-3">
            <path d="M20 2 Q38 8 56 2" stroke="#8A6F5A" strokeWidth="1.2" fill="none" />
        </svg>
        <Colgante style={{ left: 0, top: '4px', width: '76px', height: '50px' }} ritmo={{ duracion: 5.4, retraso: 0 }}>
            <div className="relative w-19 h-12.5">
                {PILA.map(({ color, r, dx }) => (
                    <div key={color} className="absolute origin-top" style={{ left: `${24 + dx}px`, top: `${Math.abs(dx) / 3}px`, transform: `rotate(${r}deg)` }}>
                        <PapelPicado color={color} className="block w-7 h-8.75" />
                    </div>
                ))}
                <div className="absolute left-6 top-0.75 drop-shadow-[0_2px_2px_#1A266433]">
                    <PapelPicado color={COLORES[0]} className="block w-7 h-8.75" />
                </div>
            </div>
        </Colgante>
    </div>
);

const BanderasPapelPicado = ({ variante = 'cordel' }) => {
    const decoracion = useDecoracionEvento();
    if (!esDiaDeMuertos(decoracion)) return null;
    return variante === 'pila' ? <Pila /> : <Cordel />;
};

export default BanderasPapelPicado;

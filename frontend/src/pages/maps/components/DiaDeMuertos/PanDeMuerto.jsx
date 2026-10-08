import { useId } from 'react';

const BULTOS = [[6.2, 3], [11.2, 3.3], [16.4, 3.5]];
const BRAZOS = [45, 135, 225, 315];
const AZUCAR = [[20, 9, 0.9], [31, 20, 0.9], [20, 31, 0.9], [9, 20, 0.9], [25, 12.5, 0.7], [13, 26, 0.7], [27, 26.5, 0.7], [13.5, 13, 0.7]];
const DIENTES = [0, 30, 60, 90, 120, 150, 180];
const LADOS = [-16, -20, -24];

const Huesito = ({ angulo }) => (
    <g transform={`rotate(${angulo} 20 20)`}>
        <g fill="#8E4F1C">{BULTOS.map(([d, r]) => <circle key={d} cx="20.7" cy={20.7 - d} r={r} />)}</g>
        <g fill="#BC732F">{BULTOS.map(([d, r]) => <circle key={d} cx="20" cy={20 - d} r={r} />)}</g>
        <g fill="#E0A863">{BULTOS.map(([d, r]) => <circle key={d} cx="19" cy={19 - d} r={r * 0.35} />)}</g>
    </g>
);

const Mordida = ({ holgura }) => {
    const r = 7 + holgura;
    return (
        <g transform="translate(20 20) rotate(45)">
            <circle cx="0" cy="-12" r={r} />
            <rect x={-r} y="-32" width={2 * r} height="20" />
            {DIENTES.map((t) => {
                const rad = (t * Math.PI) / 180;
                return <circle key={`d${t}`} cx={r * Math.cos(rad)} cy={-12 + r * Math.sin(rad)} r="1.9" />;
            })}
            {LADOS.flatMap((y) => [-1, 1].map((lado) => <circle key={`l${y}${lado}`} cx={lado * r} cy={y} r="1.9" />))}
        </g>
    );
};

const PanDeMuerto = ({ mordido = false, className = '' }) => {
    const id = `pan-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
    return (
        <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
            {mordido && (
                <defs>
                    <mask id={`${id}-mordida`} maskUnits="userSpaceOnUse" x="0" y="0" width="40" height="40">
                        <rect width="40" height="40" fill="#FFFFFF" />
                        <g fill="#000000"><Mordida holgura={0} /></g>
                    </mask>
                    <clipPath id={`${id}-miga`}><circle cx="20" cy="20" r="15" /></clipPath>
                </defs>
            )}
            <g mask={mordido ? `url(#${id}-mordida)` : undefined}>
                <circle cx="20.6" cy="20.6" r="15" fill="#8E4F1C" opacity="0.5" />
                <circle cx="20" cy="20" r="15" fill="#B86E2B" />
                <circle cx="19.5" cy="19.5" r="13.6" fill="#D9953F" />
                <circle cx="16.5" cy="16" r="7" fill="#E3A859" opacity="0.45" />
                {BRAZOS.map((a) => <Huesito key={a} angulo={a} />)}
                <circle cx="20.7" cy="20.7" r="5" fill="#8E4F1C" />
                <circle cx="20" cy="20" r="5" fill="#C27A31" />
                <circle cx="18.6" cy="18.6" r="1.8" fill="#E0A657" />
                <g fill="#FFF6E5" opacity="0.9">{AZUCAR.map(([x, y, r]) => <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />)}</g>
                {mordido && <g clipPath={`url(#${id}-miga)`} fill="#F3DCB2"><Mordida holgura={2} /></g>}
            </g>
            {mordido && (
                <g fill="#E9C48C">
                    <circle cx="17" cy="20" r="0.8" />
                    <circle cx="20" cy="23.5" r="0.7" />
                    <circle cx="14.5" cy="16" r="0.6" />
                </g>
            )}
        </svg>
    );
};

export default PanDeMuerto;

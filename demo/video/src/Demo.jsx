import { AbsoluteFill, Img, staticFile, useCurrentFrame, useVideoConfig } from 'remotion';
import { estadoCamara, transformar } from './camara';

const ONDA_S = 0.6;

// Último cuadro capturado antes de t: el screencast solo manda cuadros cuando algo cambia.
const cuadroEn = (cuadros, t) => {
    let lo = 0;
    let hi = cuadros.length - 1;
    while (lo < hi) {
        const mid = Math.ceil((lo + hi) / 2);
        if (cuadros[mid].t <= t) lo = mid;
        else hi = mid - 1;
    }
    return cuadros[lo];
};

const Onda = ({ x, y, k }) => (
    <div
        style={{
            position: 'absolute',
            left: x,
            top: y,
            width: 64,
            height: 64,
            marginLeft: -32,
            marginTop: -32,
            borderRadius: '50%',
            border: '3px solid #F28C0F',
            background: 'rgba(242,140,15,0.18)',
            transform: `scale(${0.2 + k})`,
            opacity: 1 - k,
        }}
    />
);

export const Demo = ({ guion, datos }) => {
    const frame = useCurrentFrame();
    const { fps, width, height } = useVideoConfig();
    const t = datos.inicio + frame / fps;
    const cuadro = cuadroEn(datos.cuadros, t);
    const camara = estadoCamara(datos.camara, t, datos);
    const ondas = datos.clics.filter((c) => t >= c.t && t - c.t < ONDA_S);

    return (
        <AbsoluteFill style={{ background: '#000', overflow: 'hidden' }}>
            <div
                style={{
                    position: 'absolute',
                    width: datos.ancho,
                    height: datos.alto,
                    transformOrigin: '0 0',
                    transform: transformar(camara, { ancho: width, alto: height }),
                }}
            >
                <Img src={staticFile(`grabacion/${guion}/${cuadro.archivo}`)} style={{ width: datos.ancho, height: datos.alto }} />
                {ondas.map((c) => <Onda key={c.t} x={c.x} y={c.y} k={(t - c.t) / ONDA_S} />)}
            </div>
        </AbsoluteFill>
    );
};

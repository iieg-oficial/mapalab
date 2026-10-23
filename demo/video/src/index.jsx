import { Composition, registerRoot, staticFile } from 'remotion';
import { Demo } from './Demo';

const FPS = 30;

const Raiz = () => (
    <Composition
        id="Demo"
        component={Demo}
        fps={FPS}
        width={1920}
        height={1080}
        durationInFrames={FPS}
        defaultProps={{ guion: 'dia-de-muertos', datos: null }}
        calculateMetadata={async ({ props }) => {
            const respuesta = await fetch(staticFile(`grabacion/${props.guion}/datos.json`));
            const datos = await respuesta.json();
            return {
                props: { ...props, datos },
                width: datos.ancho - (datos.ancho % 2),
                height: datos.alto - (datos.alto % 2),
                durationInFrames: Math.ceil((datos.fin - datos.inicio) * FPS),
            };
        }}
    />
);

registerRoot(Raiz);

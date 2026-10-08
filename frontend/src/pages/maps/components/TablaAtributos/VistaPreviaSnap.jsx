import { estiloDelPanel } from '@pages/maps/helpers/tablaAcople';

const VistaPreviaSnap = ({ zona }) => {
    if (!zona) return null;

    const estilo = estiloDelPanel(zona, {
        ancho: window.innerWidth,
        alto: window.innerHeight,
    });
    if (!estilo) return null;

    return (
        <div
            aria-hidden="true"
            className="fixed z-12 rounded-[10px] border-2 border-purple bg-purple-soft/50 pointer-events-none transition-all duration-150"
            style={estilo}
        />
    );
};

export default VistaPreviaSnap;

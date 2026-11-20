import { SWIPE_ICON_COLOR } from '@pages/maps/helpers/swipeTheme';

const MARCO = 'M4,4H4V36s0,0,0,0H46V4s0,0,0,0H4M4,0H46a4,4,0,0,1,4,4V36a4,4,0,0,1-4,4H4a4,4,0,0,1-4-4V4A4,4,0,0,1,4,0Z';
const FLECHA = 'M4.1,6.033l-5.384-4.5a2,2,0,0,1-.253-2.817,2,2,0,0,1,2.817-.253L4.095.815,6.888-1.531a2,2,0,0,1,2.818.245A2,2,0,0,1,9.46,1.531Z';
const LINEA = 'M-6642-10373.018a2,2,0,0,1-2-2v-53.846a2,2,0,0,1,2-2,2,2,0,0,1,2,2v53.846A2,2,0,0,1-6642-10373.018Z';
const LETRA = { fill: '#fff', fontSize: 14, fontWeight: 800, fontFamily: 'Garet, sans-serif' };
const ANCHO = 72.742;
const ALTO = 57.846;

const FLECHAS_AFUERA = ['translate(929.656 732.913) rotate(90)', 'translate(990.333 741.087) rotate(-90)'];
const FLECHAS_DENTRO = ['translate(949.844 733.794) rotate(90)', 'translate(970.682 741.906) rotate(-90)'];

const IconoComparador = ({ letras, horizontal, escala = 1, className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox={horizontal ? `0 0 ${ALTO} ${ANCHO}` : `0 0 ${ANCHO} ${ALTO}`}
        style={horizontal
            ? { width: ALTO * escala, height: ANCHO * escala }
            : { width: ANCHO * escala, height: ALTO * escala }}
        className={className}
        aria-hidden="true"
    >
        <g transform={horizontal ? 'translate(765.543 -923.623) rotate(90)' : 'translate(-923.623 -707.697)'}>
            <path d={MARCO} transform="translate(935.13 717.263)" fill="#fff" />
            {(letras ? FLECHAS_AFUERA : FLECHAS_DENTRO).map(transform => (
                <path key={transform} d={FLECHA} transform={transform} fill={SWIPE_ICON_COLOR} />
            ))}
            <path d={LINEA} transform="translate(7601.5 11138.561)" fill={SWIPE_ICON_COLOR} />
            {letras && (
                <>
                    <text transform={horizontal ? 'translate(954.5 742.5) rotate(-90)' : 'translate(944 742)'} {...LETRA}>A</text>
                    <text transform={horizontal ? 'translate(976 742) rotate(-90)' : 'translate(966 742)'} {...LETRA}>B</text>
                </>
            )}
        </g>
    </svg>
);

export default IconoComparador;

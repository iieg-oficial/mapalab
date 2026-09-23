import {
    rumboDeAngulo, VIEW3D_COLUMN_RANGE, VIEW3D_EXAGGERATION_RANGE, VIEW3D_PITCH_MAX,
} from '@pages/maps/helpers/view3d';

const [EXAG_MIN, EXAG_MAX] = VIEW3D_EXAGGERATION_RANGE;
const [COL_MIN, COL_MAX] = VIEW3D_COLUMN_RANGE;

export const deslizadores3d = ({ pitch, exaggeration, sol, alturaColumnas, setPitch, setExaggeration, setSol, setAlturaColumnas }) => ({
    pitch: {
        titulo: 'Inclinación', valor: Math.round(pitch), texto: `${Math.round(pitch)}°`, corto: `${Math.round(pitch)}°`,
        min: 0, max: VIEW3D_PITCH_MAX, step: 1, onChange: setPitch, pct: (pitch / VIEW3D_PITCH_MAX) * 100, tono: '#5C2472',
    },
    exag: {
        titulo: 'Relieve', valor: exaggeration, texto: `×${exaggeration}`, corto: `×${exaggeration}`,
        min: EXAG_MIN, max: EXAG_MAX, step: 0.5, onChange: setExaggeration, pct: ((exaggeration - EXAG_MIN) / (EXAG_MAX - EXAG_MIN)) * 100, tono: '#FF8300',
    },
    sol: {
        titulo: 'Sol', valor: sol, texto: `${rumboDeAngulo(sol)} · ${sol}°`, corto: rumboDeAngulo(sol),
        min: 0, max: 359, step: 5, onChange: setSol, pct: (sol / 360) * 100, tono: '#E0A800',
    },
    altura: {
        titulo: 'Altura sobre los puntos', valor: alturaColumnas, texto: `×${alturaColumnas}`, corto: `×${alturaColumnas}`,
        min: COL_MIN, max: COL_MAX, step: 0.5, onChange: setAlturaColumnas, pct: ((alturaColumnas - COL_MIN) / (COL_MAX - COL_MIN)) * 100, tono: '#0072B2',
    },
});

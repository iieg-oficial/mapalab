import { useRef, useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useView3d } from '@contexts/View3dContext';
import {
    rumboDeAngulo, VIEW3D_COLUMN_RANGE, VIEW3D_EXAGGERATION_RANGE, VIEW3D_PITCH_MAX,
} from '@pages/maps/helpers/view3d';
import Map3DRing from './Map3DRing';
import Map3DSliderPopover from './Map3DSliderPopover';
import Map3DAjustes from './Map3DAjustes';

const [EXAG_MIN, EXAG_MAX] = VIEW3D_EXAGGERATION_RANGE;
const [COL_MIN, COL_MAX] = VIEW3D_COLUMN_RANGE;
const BOTON_AJUSTES = 'size-8 shrink-0 rounded-full grid place-items-center text-[#465055] hover:text-[#70308A] cursor-pointer';

const Map3DBar = () => {
    const {
        active, pitch, exaggeration, sol, alturaColumnas, extruded,
        setPitch, setExaggeration, setSol, setAlturaColumnas, orbita,
    } = useView3d();
    const [abierto, setAbierto] = useState(null);
    const refs = { pitch: useRef(null), exag: useRef(null), sol: useRef(null), altura: useRef(null), ajustes: useRef(null) };
    if (!active) return null;

    const alternar = (cual) => setAbierto(previo => (previo === cual ? null : cual));
    const anillos = [
        { clave: 'pitch', label: 'Inclinación', texto: `${Math.round(pitch)}°`, pct: (pitch / VIEW3D_PITCH_MAX) * 100, tono: '#5C2472' },
        { clave: 'exag', label: 'Exageración del relieve', texto: `×${exaggeration}`, pct: ((exaggeration - EXAG_MIN) / (EXAG_MAX - EXAG_MIN)) * 100, tono: '#FF8300' },
        { clave: 'sol', label: 'Dirección del sol', texto: rumboDeAngulo(sol), pct: (sol / 360) * 100, tono: '#E0A800' },
        ...(extruded.length ? [{ clave: 'altura', label: 'Altura de las columnas', texto: `×${alturaColumnas}`, pct: ((alturaColumnas - COL_MIN) / (COL_MAX - COL_MIN)) * 100, tono: '#0072B2' }] : []),
    ];
    const deslizadores = {
        pitch: { titulo: 'Inclinación', valor: Math.round(pitch), texto: `${Math.round(pitch)}°`, min: 0, max: VIEW3D_PITCH_MAX, step: 1, onChange: setPitch },
        exag: { titulo: 'Relieve', valor: exaggeration, texto: `×${exaggeration}`, min: EXAG_MIN, max: EXAG_MAX, step: 0.5, onChange: setExaggeration },
        sol: { titulo: 'Sol', valor: sol, texto: `${rumboDeAngulo(sol)} · ${sol}°`, min: 0, max: 359, step: 5, onChange: setSol },
        altura: { titulo: 'Columnas', valor: alturaColumnas, texto: `×${alturaColumnas}`, min: COL_MIN, max: COL_MAX, step: 0.5, onChange: setAlturaColumnas },
    };

    return (
        <div className="ml-3 flex items-center px-3 h-11 gap-2 rounded-full bg-white shadow-[0_5px_20px_#1A26641A]">
            {anillos.map(({ clave, label, texto, pct, tono }) => (
                <Tooltip key={clave} content={`${label}: ${deslizadores[clave].texto}`}>
                    <Map3DRing
                        botonRef={refs[clave]}
                        label={label}
                        texto={texto}
                        porcentaje={pct}
                        tono={tono}
                        abierto={abierto === clave}
                        onToggle={() => alternar(clave)}
                    />
                </Tooltip>
            ))}
            <Tooltip content="Terreno, cielo y órbita">
                <button
                    ref={refs.ajustes}
                    type="button"
                    className={`${BOTON_AJUSTES} ${orbita ? 'text-[#5C2472]' : ''}`}
                    onClick={() => alternar('ajustes')}
                    aria-expanded={abierto === 'ajustes'}
                    aria-label="Terreno, cielo y órbita"
                >
                    <Icon name="settings" className="size-5" />
                </button>
            </Tooltip>
            {deslizadores[abierto] && (
                <Map3DSliderPopover anchorRef={refs[abierto]} {...deslizadores[abierto]} onClose={() => setAbierto(null)} />
            )}
            {abierto === 'ajustes' && <Map3DAjustes anchorRef={refs.ajustes} onClose={() => setAbierto(null)} />}
        </div>
    );
};

export default Map3DBar;

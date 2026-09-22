import { useRef, useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useView3d } from '@contexts/View3dContext';
import Map3DSettingsPopover from './Map3DSettingsPopover';

const COMPASS_BUTTON = [
    'flex items-center justify-center h-12.5 w-12.5 rounded-[30px] transition cursor-pointer',
    'bg-[#703089] text-white hover:bg-[#5C2472] hover:shadow-[0_6px_6px_#5C247234]',
].join(' ');

const AJUSTES_BUTTON = 'flex items-center justify-center size-9 rounded-full bg-white shadow-[0_5px_20px_#1A26641A] text-[#465055] hover:text-[#70308A] transition cursor-pointer';

const Map3DBar = () => {
    const { active, bearing, setBearing } = useView3d();
    const [ajustesAbiertos, setAjustesAbiertos] = useState(false);
    const ajustesRef = useRef(null);
    if (!active) return null;

    return (
        <div className="ml-2 flex items-end gap-2">
            <Tooltip content="Inclinación y relieve">
                <button
                    ref={ajustesRef}
                    type="button"
                    className={AJUSTES_BUTTON}
                    onClick={() => setAjustesAbiertos(abierto => !abierto)}
                    aria-expanded={ajustesAbiertos}
                    aria-label="Inclinación y relieve"
                >
                    <Icon name="settings" className="size-5" />
                </button>
            </Tooltip>
            <Tooltip content="Orientar al norte">
                <button type="button" className={COMPASS_BUTTON} onClick={() => setBearing(0)} aria-label="Orientar al norte">
                    <svg viewBox="0 0 24 24" className="size-7" style={{ transform: `rotate(${-bearing}deg)` }} aria-hidden="true">
                        <path d="M12 3l4.5 10h-9z" fill="currentColor" />
                        <path d="M12 21l-4.5-10h9z" fill="currentColor" fillOpacity="0.45" />
                    </svg>
                </button>
            </Tooltip>
            {ajustesAbiertos && <Map3DSettingsPopover anchorRef={ajustesRef} onClose={() => setAjustesAbiertos(false)} />}
        </div>
    );
};

export default Map3DBar;

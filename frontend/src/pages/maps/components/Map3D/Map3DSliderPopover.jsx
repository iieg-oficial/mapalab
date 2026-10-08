import Map3DPopover from './Map3DPopover';
import Map3DDeslizador from './Map3DDeslizador';

const Map3DSliderPopover = ({ anchorRef, bordeRef, onClose, ...deslizador }) => (
    <Map3DPopover
        anchorRef={anchorRef}
        bordeRef={bordeRef}
        onClose={onClose}
        width={210}
        etiqueta={deslizador.titulo}
        className="bg-white rounded-[10px] shadow-[0px_3px_24px_#00000029] px-3 py-2.5"
    >
        <Map3DDeslizador {...deslizador} />
    </Map3DPopover>
);

export default Map3DSliderPopover;

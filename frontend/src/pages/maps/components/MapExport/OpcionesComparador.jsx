import Tooltip from '@components/Tooltip';
import Checkbox from '@components/Checkbox';

const OpcionesComparador = ({ conBarra, conEtiquetas, onBarra, onEtiquetas }) => (
    <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
        <Tooltip content="Dibuja la línea que separa los dos mapas" placement="left" delay={400} triggerBlock>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <Checkbox checked={conBarra} onChange={onBarra} />
                Incluir barra divisora
            </label>
        </Tooltip>
        <Tooltip content="Pone la etiqueta A o B y la fecha de cada lado" placement="left" delay={400} triggerBlock>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                <Checkbox checked={conEtiquetas} onChange={onEtiquetas} />
                Incluir etiquetas A / B con fecha
            </label>
        </Tooltip>
    </div>
);

export default OpcionesComparador;

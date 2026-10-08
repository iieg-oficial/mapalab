import Icon from '@components/Icon';
import ActionIconButton from '@components/ActionIconButton';

const PanelHeader = ({ icono, onVolver, titulo, detalle, acciones, className = '' }) => (
    <div className={`sticky top-0 z-[4] -mx-4.5 px-4.5 pt-1 pb-2 flex items-center justify-between gap-3 shrink-0 bg-[#F9FBFF]/85 backdrop-blur-md ${className}`}>
        <div className="min-w-0 flex items-center gap-2">
            {onVolver ? (
                <ActionIconButton
                    onClick={onVolver}
                    titulo="Volver"
                    etiqueta="Volver al resumen de estadísticas"
                    tamano="sm"
                >
                    <Icon name="chevron" className="size-3.5 rotate-90" />
                </ActionIconButton>
            ) : icono}
            <h3 className="font-garet font-bold text-[13px]/[16px] text-[#2E4372] truncate">{titulo}</h3>
            {detalle}
        </div>
        {acciones && <div className="ml-auto flex items-center gap-1 shrink-0">{acciones}</div>}
    </div>
);

export default PanelHeader;

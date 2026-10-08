import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';

const PanelHoja = ({ titulo, extra = null, onCerrar, etiquetaCerrar = 'Cerrar', className = '', children, ...props }) => (
    <div {...props} className={`w-full px-4 pt-3 pb-4 bg-[#F9FBFF] rounded-[14px] flex flex-col ${className}`}>
        <div className="flex items-center justify-between gap-2 shrink-0">
            <h3 className="text-[18px]/[24px] font-garet font-bold text-purple tracking-normal">{titulo}</h3>
            <div className="flex items-center gap-2">
                {extra}
                {onCerrar && (
                    <Tooltip content={etiquetaCerrar} placement="left" delay={400}>
                        <button
                            type="button"
                            onClick={onCerrar}
                            aria-label={etiquetaCerrar}
                            className="size-7 shrink-0 flex items-center justify-center rounded-full text-purple hover:bg-purple hover:text-white transition cursor-pointer"
                        >
                            <Icon name="close" className="size-4" />
                        </button>
                    </Tooltip>
                )}
            </div>
        </div>
        {children}
    </div>
);

export default PanelHoja;

import Icon from '@components/Icon';
import Loading from '@components/Loading';
import Tooltip from '@components/Tooltip';
import { LICENCIA_URL, LICENCIA_TEXTO } from '@constants/app';
import { formatBytes } from '../../../hooks/useLayerDownload';

const licenciaContent = (
    <span className="text-[11px]/[15px]">
        {LICENCIA_TEXTO}{' '}
        <a href={LICENCIA_URL} target="_blank" rel="noopener noreferrer" className="underline font-semibold">Licencia IIEG 2026</a>
    </span>
);

const DownloadButton = ({
    downloading,
    progress,
    disabled,
    onDownload,
    onCancel,
    onMenuToggle,
    menuAnchorRef,
    isMobile,
}) => {
    if (downloading) {
        return (
            <Tooltip content="Toca para cancelar" variant="warning" placement="top" forceVisible={isMobile}>
                <button
                    onClick={onCancel}
                    className="relative flex items-center justify-center gap-2 md:w-[220px] px-5 md:px-6 text-[14px]/[47px] text-white rounded-[30px] transition-colors h-12.5 font-bold font-garet bg-[#FF8300] hover:bg-[#E67500] hover:shadow-[0px_6px_6px_#FF830034] overflow-hidden"
                >
                    <Loading
                        visible
                        size="size-25 md:size-50"
                        border="border-1 md:border-3"
                        color="border-current"
                        className="absolute inset-1 !animate-[spin_3s_cubic-bezier(0.68,-0.55,0.27,1.55)_infinite]"
                    />
                    <span className="relative z-10 tabular-nums">
                        {isMobile
                            ? (progress ? formatBytes(progress.loaded) : 'Cancelar')
                            : <>Cancelar{progress && <> <span className="opacity-60">│</span> {formatBytes(progress.loaded)}</>}</>
                        }
                    </span>
                </button>
            </Tooltip>
        );
    }

    if (isMobile) {
        return (
            <Tooltip content={licenciaContent} placement="top" delay={300} interactive>
                <button
                    ref={menuAnchorRef}
                    onClick={onMenuToggle}
                    disabled={disabled}
                    className="flex items-center justify-center h-12.5 px-5 text-white rounded-[30px] transition-colors font-bold font-garet disabled:opacity-60 disabled:cursor-not-allowed bg-[#703089] hover:bg-[#5C2472] hover:shadow-[0px_6px_6px_#5C247234]"
                >
                    <Icon name="download" />
                </button>
            </Tooltip>
        );
    }

    return (
        <Tooltip content={licenciaContent} placement="top" delay={300}>
            <div ref={menuAnchorRef} className="relative flex items-center">
                <button
                    onClick={onDownload}
                    disabled={disabled}
                    className="w-full md:w-[220px] px-10 text-[14px]/[47px] text-white text-center rounded-[30px] transition-colors h-12.5 font-bold font-garet disabled:opacity-60 disabled:cursor-not-allowed bg-[#703089] hover:bg-[#5C2472] hover:shadow-[0px_6px_6px_#5C247234]"
                >
                    Descargar capa
                </button>
                <button
                    onClick={(e) => { e.stopPropagation(); onMenuToggle(); }}
                    disabled={disabled}
                    className="absolute right-0 top-0 flex items-center justify-center w-10 h-full rounded-r-[30px] transition-colors text-white hover:bg-[#5C2472] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                    <Icon name="opciones" state="normal" className="size-4.5 brightness-0 invert" />
                </button>
            </div>
        </Tooltip>
    );
};

export default DownloadButton;

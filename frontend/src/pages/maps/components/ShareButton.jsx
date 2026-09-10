import { useRef, useState, useEffect, useCallback } from 'react';
import Panel from '@components/Panel';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import SharePanel from './SharePanel';
import { useShareLink } from '@pages/maps/hooks/useShareLink';

const ABRIR_MS = 400;
const CERRAR_MS = 280;

const ShareButton = ({ onOpenChange, isDirty = false, loadedShareId = null, onCompartido }) => {
    const [open, setOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const anchorRef = useRef(null);
    const fijoRef = useRef(false);
    const abrirTimer = useRef(null);
    const cerrarTimer = useRef(null);

    const link = useShareLink({ onCreated: onCompartido });
    const linkRef = useRef(link);
    linkRef.current = link;
    const { generating, copied, error } = link;

    useEffect(() => () => {
        clearTimeout(abrirTimer.current);
        clearTimeout(cerrarTimer.current);
    }, []);

    const inSyncWithShare = !!loadedShareId && !isDirty;
    const isModifiedFromShare = !!loadedShareId && isDirty;

    const cambiarApertura = useCallback((siguiente) => {
        setOpen(siguiente);
        onOpenChange?.(siguiente);
        if (!siguiente) fijoRef.current = false;
    }, [onOpenChange]);

    const programarCierre = useCallback(() => {
        clearTimeout(abrirTimer.current);
        if (fijoRef.current) return;
        clearTimeout(cerrarTimer.current);
        cerrarTimer.current = setTimeout(() => cambiarApertura(false), CERRAR_MS);
    }, [cambiarApertura]);

    const alEntrarBoton = (evento) => {
        setIsHovered(true);
        if (evento.pointerType !== 'mouse') return;
        clearTimeout(cerrarTimer.current);
        if (open) return;
        clearTimeout(abrirTimer.current);
        abrirTimer.current = setTimeout(() => {
            cambiarApertura(true);
            linkRef.current.ensureShare();
        }, ABRIR_MS);
    };

    const alSalirBoton = (evento) => {
        setIsHovered(false);
        if (evento.pointerType !== 'mouse') return;
        programarCierre();
    };

    const alEntrarPanel = () => clearTimeout(cerrarTimer.current);

    const handleClick = () => {
        clearTimeout(abrirTimer.current);
        clearTimeout(cerrarTimer.current);
        if (open && fijoRef.current) {
            cambiarApertura(false);
            return;
        }
        fijoRef.current = true;
        if (!open) cambiarApertura(true);
        link.copyLink();
    };

    const tooltipText = error
        ? error
        : copied
            ? '¡Enlace copiado!'
            : generating
                ? 'Generando enlace…'
                : inSyncWithShare
                    ? `Estás viendo ${loadedShareId}. Click copia un enlace nuevo`
                    : isModifiedFromShare
                        ? 'Estado modificado. Click copia un enlace nuevo'
                        : 'Click copia el enlace del mapa';

    const buttonClass = error
        ? 'bg-red-100 border border-red-400 text-red-700'
        : copied
            ? 'bg-[#DCFCE7] border border-[#22C55E] text-[#16A34A]'
            : inSyncWithShare
                ? 'bg-[#DCFCE7] border border-[#22C55E] text-[#16A34A] hover:bg-[#BBF7D0]'
                : isModifiedFromShare
                    ? 'bg-gray-100 border border-gray-400 text-gray-600 hover:bg-gray-200'
                    : generating || isHovered || open
                        ? 'bg-purple-deep'
                        : 'bg-purple-soft hover:shadow-[0_6px_6px_#5C247234]';

    const iconNode = error
        ? <Icon name="alert_triangle" className="size-6" />
        : copied
            ? <Icon name="shared_click" state="hover" className="size-6" />
            : inSyncWithShare
                ? <Icon name="done" className="size-6" />
                : (
                    <Icon
                        name="copie"
                        state={(isHovered || generating || open) && !isModifiedFromShare ? 'hover' : 'normal'}
                        className="size-6"
                    />
                );

    return (
        <div className="flex flex-col relative">
            <Tooltip content={tooltipText} placement="left" delay={300}>
                <button
                    ref={anchorRef}
                    type="button"
                    onPointerEnter={alEntrarBoton}
                    onPointerLeave={alSalirBoton}
                    onClick={handleClick}
                    className={`cursor-pointer rounded-full size-12.5 flex items-center justify-center transition-colors select-none ${generating ? 'cursor-wait opacity-80' : ''} ${buttonClass}`}
                    aria-label={tooltipText}
                    aria-expanded={open}
                    aria-busy={generating}
                >
                    {iconNode}
                </button>
            </Tooltip>

            <Panel
                open={open}
                anchorRef={anchorRef}
                onClose={() => cambiarApertura(false)}
                variant="solid"
                width="w-80"
                maxHeight="max-h-[calc(100dvh-6rem)]"
                className="z-50 mt-4 shadow-none border-none rounded-[14px]"
                placement="bottom-end"
                mobileFullscreen={false}
                hideHeader
                noPadding
                bg="bg-transparent"
            >
                <SharePanel
                    link={link}
                    isDirty={isDirty}
                    loadedShareId={loadedShareId}
                    onEntrar={alEntrarPanel}
                    onSalir={programarCierre}
                    onCerrar={() => cambiarApertura(false)}
                />
            </Panel>
        </div>
    );
};

export default ShareButton;

import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useFloatingPosition } from '@hooks/useFloatingPosition';
import { IconoCandado } from './SesionIconos';

const PILL = 'h-8 px-4 rounded-full font-garet text-[12px] font-bold transition-colors cursor-pointer';

const SinSesion = ({ entrando, onEntrar }) => (
    <>
        <p className="font-garet font-bold text-[14px] text-purple">Personal del IIEG</p>
        <p className="text-[12px] leading-snug text-gray-600">Entra con tu cuenta del instituto para ver las capas privadas que te compartieron.</p>
        <button type="button" onClick={onEntrar} disabled={entrando} className={`${PILL} self-start bg-purple text-white hover:bg-purple-deep disabled:opacity-60`}>
            {entrando ? 'Esperando a minerva…' : 'Entrar con cuenta IIEG'}
        </button>
    </>
);

const ConSesion = ({ usuario, capasPrivadas, onSalir }) => (
    <>
        <div className="min-w-0">
            <p className="font-garet font-bold text-[14px] text-purple truncate">{usuario.nombre}</p>
            <p className="text-[12px] text-gray-500 truncate">{usuario.correo}</p>
        </div>
        <p className="flex items-center gap-1.5 text-[12px] text-gray-700">
            <IconoCandado className="size-3.5 text-purple" />
            {capasPrivadas === 1 ? '1 capa privada disponible' : `${capasPrivadas} capas privadas disponibles`}
        </p>
        <button type="button" onClick={onSalir} className={`${PILL} self-start bg-purple-soft text-purple hover:bg-[#E9E1F0]`}>
            Salir
        </button>
    </>
);

const SesionPopover = ({ open, anchorRef, placement, sesion, onClose }) => {
    const panelRef = useRef(null);
    useFloatingPosition({ open, anchorRef, contentRef: panelRef, placement, offset: 8 });

    useEffect(() => {
        if (!open) return undefined;
        const fuera = (e) => {
            if (panelRef.current?.contains(e.target) || anchorRef.current?.contains(e.target)) return;
            onClose();
        };
        const escape = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('mousedown', fuera);
        document.addEventListener('keydown', escape);
        return () => {
            document.removeEventListener('mousedown', fuera);
            document.removeEventListener('keydown', escape);
        };
    }, [open, onClose, anchorRef]);

    if (!open) return null;

    return createPortal(
        <div
            ref={panelRef}
            role="dialog"
            aria-label="Cuenta"
            data-sider-nohover
            className="fixed z-[9999] w-[min(18rem,calc(100vw-32px))] flex flex-col gap-3 rounded-[14px] bg-white p-4 shadow-[0_5px_20px_#1A26641A]"
        >
            {sesion.usuario
                ? <ConSesion usuario={sesion.usuario} capasPrivadas={sesion.capasPrivadas} onSalir={() => { onClose(); sesion.salir(); }} />
                : <SinSesion entrando={sesion.entrando} onEntrar={sesion.entrar} />}
            {sesion.error && <p className="text-[12px] leading-snug text-orange">{sesion.error}</p>}
        </div>,
        document.body,
    );
};

export default SesionPopover;

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import Icon from '@components/Icon';
import { useSesion } from '@contexts/SesionContext';
import { leerPendientes, suscribirPendientes } from '@pages/maps/helpers/sesion/pendientes';
import { urlApi } from '@services/sesionService';
import { IconoCandado } from './SesionIconos';

const consultar = async (refs) => {
    try {
        const params = new URLSearchParams({ refs: refs.join(',') });
        const res = await fetch(`${urlApi('sesion/pendientes')}?${params}`, { credentials: 'include', cache: 'no-store' });
        if (!res.ok) return 0;
        return (await res.json()).privadas || 0;
    } catch {
        return 0;
    }
};

const firma = (lista) => lista.join('|');

const AvisoCapasPrivadas = () => {
    const sesion = useSesion();
    const pendientes = useSyncExternalStore(suscribirPendientes, () => firma(leerPendientes()));
    const [privadas, setPrivadas] = useState(0);
    const [cerrado, setCerrado] = useState(false);
    const pedidoLogin = useRef(false);

    useEffect(() => {
        if (!pendientes || !sesion.habilitada) return undefined;
        let vigente = true;
        consultar(pendientes.split('|')).then((n) => { if (vigente) setPrivadas(n); });
        return () => { vigente = false; };
    }, [pendientes, sesion.habilitada, sesion.usuario]);

    useEffect(() => {
        if (pedidoLogin.current && sesion.usuario && sesion.revision > 0) window.location.reload();
    }, [sesion.usuario, sesion.revision]);

    if (cerrado || privadas === 0) return null;

    const texto = privadas === 1
        ? 'Este mapa trae 1 capa privada: solo la ven las personas con permiso.'
        : `Este mapa trae ${privadas} capas privadas: solo las ven las personas con permiso.`;

    const entrar = () => {
        pedidoLogin.current = true;
        sesion.entrar();
    };

    return (
        <div className="absolute z-40 top-[176px] left-4 right-4 md:top-4 md:right-auto md:left-1/2 md:-translate-x-1/2 md:w-max md:max-w-[calc(100vw-32px)]">
            <div role="status" className="flex items-center gap-2 rounded-full bg-white py-1.5 pl-3 pr-1.5 shadow-[0_5px_20px_#1A26641A]">
                <IconoCandado className="size-4 shrink-0 text-purple" />
                <span className="text-[12px] leading-tight text-[#454545]">{texto}</span>
                {!sesion.usuario && (
                    <button type="button" onClick={entrar} className="h-7 shrink-0 rounded-full bg-purple px-3 font-garet text-[12px] font-bold text-white hover:bg-purple-deep">
                        Entrar
                    </button>
                )}
                <button type="button" onClick={() => setCerrado(true)} aria-label="Cerrar aviso" className="size-7 shrink-0 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100">
                    <Icon name="close" className="size-4" />
                </button>
            </div>
        </div>
    );
};

export default AvisoCapasPrivadas;

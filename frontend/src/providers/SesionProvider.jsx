import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SesionContext } from '@contexts/SesionContext';
import {
    CANAL_SESION,
    MENSAJES_ERROR,
    fetchSesion,
    salirDeSesion,
    urlDeEntrada,
} from '@services/sesionService';
import { useIsNonProd } from '@hooks/useDevTools';

const VACIO = { habilitada: false, usuario: null, capasPrivadas: 0 };

const VENTANA = 'width=480,height=680,menubar=no,toolbar=no,location=no,status=no';

const leerErrorDeUrl = () => {
    const url = new URL(window.location.href);
    const codigo = url.searchParams.get('sesion_error');
    if (!codigo) return null;
    url.searchParams.delete('sesion_error');
    window.history.replaceState(window.history.state, '', url.toString());
    return MENSAJES_ERROR[codigo] || MENSAJES_ERROR.minerva;
};

export const SesionProvider = ({ children }) => {
    const [estado, setEstado] = useState(VACIO);
    const [revision, setRevision] = useState(0);
    const [entrando, setEntrando] = useState(false);
    const [error, setError] = useState(() => leerErrorDeUrl());
    const popupRef = useRef(null);
    const habilitada = useIsNonProd();

    const refrescar = useCallback(async () => {
        const nuevo = habilitada ? await fetchSesion() : VACIO;
        setEstado(nuevo);
        return nuevo;
    }, [habilitada]);

    useEffect(() => {
        refrescar();
    }, [refrescar]);

    useEffect(() => {
        const recibir = (datos) => {
            if (!datos || datos.tipo !== CANAL_SESION) return;
            setEntrando(false);
            if (datos.ok) {
                setError(null);
                refrescar().then(() => setRevision((r) => r + 1));
            } else {
                setError(MENSAJES_ERROR[datos.error] || MENSAJES_ERROR.minerva);
            }
        };
        let canal = null;
        try {
            canal = new BroadcastChannel(CANAL_SESION);
            canal.onmessage = (e) => recibir(e.data);
        } catch {
            canal = null;
        }
        const alGuardar = (e) => {
            if (e.key !== CANAL_SESION || !e.newValue) return;
            try {
                recibir(JSON.parse(e.newValue));
            } catch {
                return;
            }
        };
        window.addEventListener('storage', alGuardar);
        return () => {
            canal?.close();
            window.removeEventListener('storage', alGuardar);
        };
    }, [refrescar]);

    useEffect(() => {
        if (!entrando) return undefined;
        const id = setInterval(() => {
            if (popupRef.current?.closed) setEntrando(false);
        }, 800);
        return () => clearInterval(id);
    }, [entrando]);

    const entrar = useCallback(() => {
        setError(null);
        const popup = window.open(urlDeEntrada('popup'), CANAL_SESION, VENTANA);
        if (!popup) {
            const siguiente = `${window.location.pathname}${window.location.search}`;
            window.location.assign(urlDeEntrada('pagina', siguiente));
            return;
        }
        popupRef.current = popup;
        setEntrando(true);
        popup.focus?.();
    }, []);

    const salir = useCallback(async () => {
        try {
            await salirDeSesion();
        } finally {
            setEstado((e) => ({ ...e, usuario: null, capasPrivadas: 0 }));
            setRevision((r) => r + 1);
        }
    }, []);

    const limpiarError = useCallback(() => setError(null), []);

    const value = useMemo(() => ({
        ...estado,
        revision,
        entrando,
        error,
        entrar,
        salir,
        limpiarError,
    }), [estado, revision, entrando, error, entrar, salir, limpiarError]);

    return <SesionContext.Provider value={value}>{children}</SesionContext.Provider>;
};

const API_BASE = import.meta.env.VITE_BACKEND_API_HOST || '/api/';

export const CANAL_SESION = 'mapalab-sesion';

export const urlApi = (path) => {
    const base = API_BASE.endsWith('/') ? API_BASE : `${API_BASE}/`;
    return `${base}${path.startsWith('/') ? path.slice(1) : path}`;
};

const SIN_SESION = { habilitada: false, usuario: null, capasPrivadas: 0 };

export const fetchSesion = async () => {
    try {
        const res = await fetch(urlApi('sesion'), { credentials: 'include', cache: 'no-store' });
        if (!res.ok) return SIN_SESION;
        return await res.json();
    } catch {
        return SIN_SESION;
    }
};

export const fetchCapasPrivadas = async () => {
    try {
        const res = await fetch(urlApi('sesion/capas'), { credentials: 'include', cache: 'no-store' });
        if (!res.ok) return [];
        const datos = await res.json();
        return Array.isArray(datos) ? datos : [];
    } catch {
        return [];
    }
};

export const salirDeSesion = async () => {
    await fetch(urlApi('sesion/salir'), { method: 'POST', credentials: 'include' });
};

export const urlDeEntrada = (modo, siguiente = '') => {
    const params = new URLSearchParams({ modo });
    if (siguiente) params.set('siguiente', siguiente);
    return `${urlApi('sesion/entrar')}?${params.toString()}`;
};

export const MENSAJES_ERROR = {
    sin_acceso: 'Tu cuenta no tiene acceso a MapaLab. Pídelo a quien administra el visor.',
    inactivo: 'Tu acceso a MapaLab está suspendido.',
    conflicto: 'Tu correo ya está ligado a otra cuenta de minerva.',
    expirado: 'El inicio de sesión tardó demasiado. Intenta de nuevo.',
    minerva: 'No se pudo completar el inicio de sesión. Intenta de nuevo.',
    bloqueado: 'El navegador bloqueó la ventana de inicio de sesión.',
};

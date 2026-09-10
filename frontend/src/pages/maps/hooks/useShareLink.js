import { useCallback, useEffect, useRef, useState } from 'react';
import { useShareSerializer } from '@pages/maps/hooks/useShareSerializer';
import { createShare } from '@services/shareService';
import { trackShareMap } from '@services/analyticsService';
import { useMapsContext } from '@hooks/useMaps';

const COPIADO_MS = 2500;

const buildShareUrl = (id) => {
    const base = window.location.origin;
    const path = (import.meta.env.VITE_BASE_PATH || '/').replace(/\/?$/, '/');
    return `${base}${path}mapa?s=${encodeURIComponent(id)}`;
};

export const useShareLink = ({ onCreated } = {}) => {
    const serialize = useShareSerializer();
    const { compareMode, measurements } = useMapsContext();
    const [share, setShare] = useState(null);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [includeAnnotations, setIncludeAnnotations] = useState(true);
    const vigenteRef = useRef({ clave: null, share: null });
    const enCursoRef = useRef(null);
    const copiadoTimer = useRef(null);

    const annotationsCount = Array.isArray(measurements)
        ? measurements.filter(m => m?.feature && m.type !== 'Select').length
        : 0;

    useEffect(() => () => clearTimeout(copiadoTimer.current), []);

    const armarEnvelope = useCallback((conAnotaciones) => {
        const extra = { includeAnnotations: conAnotaciones && annotationsCount > 0 };
        return compareMode?.active
            ? serialize('swipe', { ...extra, position: compareMode.swipePosition ?? 0.5 })
            : serialize('single', extra);
    }, [annotationsCount, compareMode, serialize]);

    const ensureShare = useCallback(async (conAnotaciones = includeAnnotations) => {
        const envelope = armarEnvelope(conAnotaciones);
        const clave = JSON.stringify(envelope);
        if (vigenteRef.current.clave === clave && vigenteRef.current.share) return vigenteRef.current.share;
        if (enCursoRef.current?.clave === clave) return enCursoRef.current.promesa;

        setGenerating(true);
        setError(null);
        const promesa = createShare(envelope)
            .then((resultado) => {
                vigenteRef.current = { clave, share: resultado };
                setShare(resultado);
                trackShareMap('share_create');
                onCreated?.();
                return resultado;
            })
            .catch((err) => {
                setError(err?.message || 'No se pudo crear el enlace');
                return null;
            })
            .finally(() => {
                enCursoRef.current = null;
                setGenerating(false);
            });
        enCursoRef.current = { clave, promesa };
        return promesa;
    }, [armarEnvelope, includeAnnotations, onCreated]);

    const copyLink = useCallback(async () => {
        const vigente = await ensureShare();
        if (!vigente) return;
        const url = buildShareUrl(vigente.id);
        try {
            await navigator.clipboard.writeText(url);
        } catch {
            window.prompt('Selecciona y copia este enlace:', url);
        }
        setCopied(true);
        clearTimeout(copiadoTimer.current);
        copiadoTimer.current = setTimeout(() => setCopied(false), COPIADO_MS);
    }, [ensureShare]);

    const alternarAnotaciones = useCallback(() => {
        const siguiente = !includeAnnotations;
        setIncludeAnnotations(siguiente);
        ensureShare(siguiente);
    }, [includeAnnotations, ensureShare]);

    const marcarFijado = useCallback((pinnedUntil) => {
        setShare((previo) => {
            const actualizado = previo ? { ...previo, pinned_until: pinnedUntil } : previo;
            vigenteRef.current = { ...vigenteRef.current, share: actualizado };
            return actualizado;
        });
    }, []);

    return {
        share,
        url: share ? buildShareUrl(share.id) : null,
        generating,
        error,
        copied,
        includeAnnotations,
        annotationsCount,
        ensureShare,
        copyLink,
        alternarAnotaciones,
        marcarFijado,
    };
};

import { useCallback, useState } from 'react';

const LIMITE = 50;

export const useHistorial = (inicial) => {
    const [estado, setEstado] = useState(() => ({
        pasado: [],
        presente: typeof inicial === 'function' ? inicial() : inicial,
        futuro: [],
    }));

    const aplicar = useCallback((cambio) => {
        setEstado((previo) => {
            const siguiente = typeof cambio === 'function' ? cambio(previo.presente) : cambio;
            if (siguiente === previo.presente) return previo;
            return {
                pasado: [...previo.pasado, previo.presente].slice(-LIMITE),
                presente: siguiente,
                futuro: [],
            };
        });
    }, []);

    const deshacer = useCallback(() => {
        setEstado((previo) => {
            if (!previo.pasado.length) return previo;
            return {
                pasado: previo.pasado.slice(0, -1),
                presente: previo.pasado[previo.pasado.length - 1],
                futuro: [previo.presente, ...previo.futuro],
            };
        });
    }, []);

    const rehacer = useCallback(() => {
        setEstado((previo) => {
            if (!previo.futuro.length) return previo;
            return {
                pasado: [...previo.pasado, previo.presente],
                presente: previo.futuro[0],
                futuro: previo.futuro.slice(1),
            };
        });
    }, []);

    return {
        valor: estado.presente,
        aplicar,
        deshacer,
        rehacer,
        puedeDeshacer: estado.pasado.length > 0,
        puedeRehacer: estado.futuro.length > 0,
    };
};

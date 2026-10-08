import { useEffect, useMemo, useRef } from 'react';
import DragRotate from 'ol/interaction/DragRotate';
import { mouseOnly } from 'ol/events/condition';

const BOTON_DERECHO = 2;

export class RotarConClicDerecho extends DragRotate {
    constructor() {
        super({ duration: 250 });
    }

    handleDownEvent(mapBrowserEvent) {
        if (!mouseOnly(mapBrowserEvent) || mapBrowserEvent.originalEvent.button !== BOTON_DERECHO) return false;
        mapBrowserEvent.map.getView().beginInteraction();
        this.lastAngle_ = undefined;
        return true;
    }
}

export const useRotacionClicDerecho = (maps, habilitado) => {
    const interaccionesRef = useRef([]);
    const lista = useMemo(() => (Array.isArray(maps) ? maps : [maps]).filter(Boolean), [maps]);

    useEffect(() => {
        if (!lista.length) return undefined;
        const montadas = lista.map((map) => {
            const interaccion = new RotarConClicDerecho();
            map.addInteraction(interaccion);
            return { map, interaccion };
        });
        interaccionesRef.current = montadas;
        return () => {
            montadas.forEach(({ map, interaccion }) => map.removeInteraction(interaccion));
            interaccionesRef.current = [];
        };
    }, [lista]);

    useEffect(() => {
        interaccionesRef.current.forEach(({ interaccion }) => interaccion.setActive(habilitado));
        if (!habilitado) return undefined;
        const sinMenu = (event) => event.preventDefault();
        const destinos = lista.map(map => map.getTargetElement()).filter(Boolean);
        destinos.forEach(destino => destino.addEventListener('contextmenu', sinMenu));
        return () => destinos.forEach(destino => destino.removeEventListener('contextmenu', sinMenu));
    }, [lista, habilitado]);
};

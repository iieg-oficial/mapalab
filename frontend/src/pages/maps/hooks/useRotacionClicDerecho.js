import { useEffect, useRef } from 'react';
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

export const useRotacionClicDerecho = (map, habilitado) => {
    const interaccionRef = useRef(null);

    useEffect(() => {
        if (!map) return undefined;
        const interaccion = new RotarConClicDerecho();
        interaccionRef.current = interaccion;
        map.addInteraction(interaccion);
        return () => {
            map.removeInteraction(interaccion);
            interaccionRef.current = null;
        };
    }, [map]);

    useEffect(() => {
        interaccionRef.current?.setActive(habilitado);
        const destino = map?.getTargetElement();
        if (!destino || !habilitado) return undefined;
        const sinMenu = (event) => event.preventDefault();
        destino.addEventListener('contextmenu', sinMenu);
        return () => destino.removeEventListener('contextmenu', sinMenu);
    }, [map, habilitado]);
};

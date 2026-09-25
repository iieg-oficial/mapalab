import { useEffect, useRef } from 'react';
import { toLonLat } from 'ol/proj';
import { loadMaplibre } from '@pages/maps/helpers/maplibreLoader';
import { svgToDataUrl } from '@pages/maps/helpers/drawingStyles';
import { textoVisibleDePin } from '@pages/maps/helpers/pin';

const TIPOS = new Set(['Pin', 'Text', 'Emoji']);
const PIN_ICONO = svgToDataUrl('<svg xmlns="http://www.w3.org/2000/svg" width="28" height="38" viewBox="0 0 28 38"><path d="M14 1C6.8 1 1 6.8 1 14c0 9.6 11.2 21.4 12.3 22.5a1 1 0 0 0 1.4 0C15.8 35.4 27 23.6 27 14 27 6.8 21.2 1 14 1z" fill="#5c2472" stroke="#fff" stroke-width="2"/><circle cx="14" cy="14" r="5" fill="#fff"/></svg>');

const etiqueta = (texto) => {
    const span = document.createElement('span');
    span.textContent = texto;
    span.style.cssText = 'font:600 12px "Garet","Inter",sans-serif;color:#111827;background:rgba(255,255,255,.92);padding:3px 6px;border-radius:4px;white-space:nowrap';
    return span;
};

const soporte = (estilo) => {
    const pie = document.createElement('div');
    pie.style.pointerEvents = 'none';
    if (estilo === 'poste') {
        pie.style.cssText += ';display:flex;flex-direction:column;align-items:center';
        const poste = document.createElement('div');
        poste.style.cssText = 'width:2px;height:22px;background:#465055';
        const base = document.createElement('div');
        base.style.cssText = 'width:6px;height:6px;border-radius:50%;background:#465055';
        pie.append(poste, base);
    } else {
        pie.style.cssText += ';width:22px;height:6px;border-radius:50%;background:rgba(26,38,100,.22);margin-top:2px';
    }
    return pie;
};

const deCuerpoEntero = (raiz, estilo) => {
    if (estilo !== 'poste' && estilo !== 'sombra') return { elemento: raiz, anchor: 'center', offset: [0, 0] };
    raiz.style.cssText += ';display:flex;flex-direction:column;align-items:center';
    raiz.appendChild(soporte(estilo));
    return { elemento: raiz, anchor: 'bottom', offset: [0, 0] };
};

const ORIGENES = { center: 'center', bottom: 'bottom center', 'bottom-left': 'bottom left' };

export const escalarMarcador = ({ elemento, anchor, offset }, escala = 1) => {
    if (escala === 1) return { elemento, anchor, offset };
    const cuerpo = document.createElement('div');
    cuerpo.style.cssText = `pointer-events:none;transform:scale(${escala});transform-origin:${ORIGENES[anchor] || 'center'}`;
    cuerpo.append(...elemento.childNodes);
    cuerpo.style.display = elemento.style.display;
    cuerpo.style.flexDirection = elemento.style.flexDirection;
    cuerpo.style.alignItems = elemento.style.alignItems;
    cuerpo.style.gap = elemento.style.gap;
    elemento.replaceChildren(cuerpo);
    return { elemento, anchor, offset };
};

export const elementoDeAnotacion = (medicion, estilo = 'frente') => {
    const feature = medicion.feature;
    const tipo = medicion.type;
    const raiz = document.createElement('div');
    raiz.style.pointerEvents = 'none';

    if (tipo === 'Pin') {
        raiz.style.cssText += ';display:flex;align-items:flex-start;gap:6px';
        const img = document.createElement('img');
        img.src = PIN_ICONO;
        img.width = 28;
        img.height = 38;
        img.alt = '';
        raiz.appendChild(img);
        const texto = textoVisibleDePin(feature);
        if (texto) raiz.appendChild(etiqueta(texto));
        return { elemento: raiz, anchor: 'bottom-left', offset: [-14, 0] };
    }

    const escala = feature.get('scale') || 1;
    const rotacion = ((feature.get('rotation') || 0) * 180) / Math.PI;
    if (tipo === 'Text') {
        const span = etiqueta(feature.get('textLabel') || '');
        span.style.color = feature.get('fillColor') || '#111827';
        span.style.background = feature.get('bgColor') || 'transparent';
        span.style.fontSize = `${Math.round(14 * escala)}px`;
        span.style.transform = `rotate(${rotacion}deg)`;
        raiz.appendChild(span);
        return { elemento: raiz, anchor: 'center', offset: [0, 0] };
    }

    const simbolo = feature.get('symbolPayload') || { kind: 'emoji', value: feature.get('textLabel') || '' };
    if (simbolo.kind === 'emoji') {
        const span = document.createElement('span');
        span.textContent = simbolo.value;
        span.style.cssText = `font-size:${Math.round(28 * escala)}px;line-height:1;display:inline-block;transform:rotate(${rotacion}deg)`;
        raiz.appendChild(span);
    } else {
        const img = document.createElement('img');
        img.src = simbolo.kind === 'svg' ? svgToDataUrl(simbolo.value || '') : (simbolo.imageUrl || simbolo.image_url || simbolo.value);
        img.alt = '';
        img.style.cssText = `width:${Math.round(32 * escala)}px;transform:rotate(${rotacion}deg)`;
        raiz.appendChild(img);
    }
    return deCuerpoEntero(raiz, estilo);
};

export const anotacionesPuntuales = (measurements = []) => measurements.filter(m => (
    TIPOS.has(m.type) && m.visible !== false && m.feature?.getGeometry?.()?.getType?.() === 'Point'
));

export const useAnotacionesPuntuales3d = (map, measurements, estilo = 'frente', escala = 1) => {
    const marcadoresRef = useRef([]);

    useEffect(() => {
        if (!map) return undefined;
        let vigente = true;
        const quitar = () => {
            marcadoresRef.current.forEach(marcador => marcador.remove());
            marcadoresRef.current = [];
        };

        loadMaplibre().then((maplibregl) => {
            if (!vigente) return;
            quitar();
            marcadoresRef.current = anotacionesPuntuales(measurements).map((medicion) => {
                const { elemento, anchor, offset } = escalarMarcador(elementoDeAnotacion(medicion, estilo), escala);
                return new maplibregl.Marker({ element: elemento, anchor, offset })
                    .setLngLat(toLonLat(medicion.feature.getGeometry().getCoordinates()))
                    .addTo(map);
            });
        }).catch(() => {});

        return () => {
            vigente = false;
            quitar();
        };
    }, [map, measurements, estilo, escala]);
};

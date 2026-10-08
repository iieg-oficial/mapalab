import { useEffect, useState } from 'react';
import Checkbox from '@components/Checkbox';
import ScrollContainer from '@components/ScrollContainer';
import Tooltip from '@components/Tooltip';
import SymbologyItem from '../SymbologyItem';
import { camposDeCapa } from '@services/seleccionStatsService';
import { fetchConfigColumnas } from '@services/tablaAtributosService';

const SIN_CAMPO = '';

const etiquetaDe = (nombre, columnas) => columnas.find(c => c.nombre === nombre)?.alias || nombre;

const useCamposDeCapa = (layerId, activo, allLayers) => {
    const [campos, setCampos] = useState([]);

    useEffect(() => {
        if (!activo || !layerId) {
            setCampos([]);
            return undefined;
        }
        let vigente = true;
        (async () => {
            const [{ numericos, clases }, columnas] = await Promise.all([
                camposDeCapa({ id: layerId }, allLayers),
                fetchConfigColumnas(layerId).catch(() => []),
            ]);
            if (!vigente) return;
            setCampos([
                ...numericos.map(nombre => ({ nombre, etiqueta: etiquetaDe(nombre, columnas), porClase: false })),
                ...clases.map(nombre => ({ nombre, etiqueta: etiquetaDe(nombre, columnas), porClase: true })),
            ]);
        })();
        return () => { vigente = false; };
    }, [layerId, activo, allLayers]);

    return campos;
};

const SelectorCampo = ({ layer, activo, allLayers, elegido, onElegir }) => {
    const campos = useCamposDeCapa(layer.id, activo, allLayers);
    if (!activo) return null;

    return (
        <Tooltip
            content={campos.length > 0
                ? 'Suma y promedia un campo numérico, o cuenta los elementos por clase, dentro del área seleccionada'
                : 'Esta capa no tiene campos que resumir'}
            placement="left"
            delay={400}
            triggerBlock
        >
            <select
                value={elegido?.nombre || SIN_CAMPO}
                disabled={campos.length === 0}
                aria-label={`Estadística de ${layer.label || layer.name}`}
                onChange={(evento) => onElegir(campos.find(c => c.nombre === evento.target.value) || null)}
                className="w-full mt-1 appearance-none rounded-[7px] bg-[#EAEFFA] px-2.5 py-1.5 font-garet text-[12px] font-bold text-purple disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
            >
                <option value={SIN_CAMPO}>Sin estadística</option>
                {[false, true].map(porClase => {
                    const grupo = campos.filter(campo => campo.porClase === porClase);
                    if (grupo.length === 0) return null;
                    return (
                        <optgroup key={String(porClase)} label={porClase ? 'Contar por clase' : 'Sumar y promediar'}>
                            {grupo.map(campo => <option key={campo.nombre} value={campo.nombre}>{campo.etiqueta}</option>)}
                        </optgroup>
                    );
                })}
            </select>
        </Tooltip>
    );
};

const LegendPicker = ({ layers, seleccionadas, onAlternar, formato, campos, onCampo, allLayers, conEstadisticas }) => (
    <ScrollContainer className="max-h-56 bg-white rounded-[7px] p-2">
        {layers.map(layer => {
            const marcada = seleccionadas.some(l => l.id === layer.id);
            return (
                <div key={layer.id} className="mb-1 last:mb-0">
                    <Tooltip
                        content={formato === 'pdf' ? 'Incluye la leyenda de esta capa en el PDF' : 'Usa la leyenda de esta capa en la imagen'}
                        placement="left"
                        delay={400}
                        triggerBlock
                    >
                        <SymbologyItem
                            layer={layer}
                            isExpanded={false}
                            onToggle={() => { }}
                            showDivider={false}
                            simple={true}
                            onClick={() => onAlternar(layer)}
                            prefix={<Checkbox checked={marcada} />}
                        />
                    </Tooltip>
                    <SelectorCampo
                        layer={layer}
                        activo={conEstadisticas && marcada}
                        allLayers={allLayers}
                        elegido={campos[layer.id]}
                        onElegir={(campo) => onCampo(layer.id, campo)}
                    />
                </div>
            );
        })}
    </ScrollContainer>
);

export default LegendPicker;

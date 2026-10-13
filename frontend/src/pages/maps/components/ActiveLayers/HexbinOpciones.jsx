import { useEffect, useRef, useState } from 'react';
import DropdownPill from '@components/DropdownPill';
import { camposDeWmsConfig } from '@services/seleccionStatsService';
import { METODOS_HEXBIN, opcionesDeValor, opcionesDeValores, valorDeOpciones } from '@pages/maps/helpers/hexbinOpciones';

const HexbinOpciones = ({ wmsConfig, opciones, onCambio }) => {
    const [campos, setCampos] = useState([]);
    const llave = wmsConfig ? `${wmsConfig.baseUrl}|${wmsConfig.layerName}` : '';
    const configRef = useRef(wmsConfig);
    configRef.current = wmsConfig;

    useEffect(() => {
        let vigente = true;
        if (!llave) return undefined;
        camposDeWmsConfig(configRef.current).then(({ numericos }) => {
            if (vigente) setCampos(numericos);
        });
        return () => {
            vigente = false;
        };
    }, [llave]);

    const valor = valorDeOpciones(opciones);

    return (
        <div className="flex flex-wrap gap-2 px-3 pb-3">
            <DropdownPill
                etiqueta="Qué se agrupa en cada hexágono"
                valor={valor}
                opciones={opcionesDeValores(campos)}
                onCambio={siguiente => onCambio(opcionesDeValor(siguiente, opciones.metodo))}
            />
            <DropdownPill
                etiqueta="Cómo se reparten los colores"
                valor={opciones.metodo}
                opciones={METODOS_HEXBIN}
                onCambio={metodo => onCambio(opcionesDeValor(valor, metodo))}
            />
        </div>
    );
};

export default HexbinOpciones;

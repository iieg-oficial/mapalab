import Segmented from '@components/Segmented';
import DropdownPill from '@components/DropdownPill';

const EJES = [
    { value: 'municipio', label: 'Municipio' },
    { value: 'propiedad', label: 'Propiedad' },
];

const ControlesGrafica = ({
    grupos, columnas, eje, onEje, municipio, onMunicipio, indicador, onIndicador,
}) => {
    if (grupos.length < 2) return null;

    return (
        <>
            <Segmented
                compact
                className="h-7 border border-white"
                ariaLabel="Qué eje graficar"
                value={eje}
                onChange={onEje}
                options={EJES}
            />
            {eje === 'propiedad' ? (
                <DropdownPill
                    multiple
                    etiqueta="Propiedades a graficar"
                    valor={indicador}
                    onCambio={onIndicador}
                    resumen={(elegidas) => (elegidas.length === 1 ? elegidas[0] : `${elegidas.length} propiedades`)}
                    opciones={grupos.map(g => ({ valor: g.nombre, texto: g.nombre }))}
                />
            ) : (
                <DropdownPill
                    multiple
                    etiqueta="Municipios a graficar"
                    valor={municipio}
                    onCambio={onMunicipio}
                    resumen={(elegidas) => (elegidas.length === 1
                        ? columnas.find(c => c.clave === elegidas[0])?.nombre
                        : `${elegidas.length} municipios`)}
                    opciones={columnas.map(c => ({ valor: c.clave, texto: c.nombre }))}
                />
            )}
        </>
    );
};

export default ControlesGrafica;

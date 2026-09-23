import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';
import { useSiderAdaptivePosition } from '@contexts/SiderContext';
import { useMapsContext } from '@hooks/useMaps';
import { useMedicion3d } from '@hooksMaps/useMedicion3d';
import { formatAreaValue, formatLengthValue } from '@pages/maps/helpers/formatMeasure';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import PerfilElevacion from './PerfilElevacion';

const HERRAMIENTAS = [
    { id: 'punto', icono: 'geom_point', label: 'Altura de un punto' },
    { id: 'linea', icono: 'linea', label: 'Medir distancia' },
    { id: 'poligono', icono: 'poligono', label: 'Medir área' },
];

const BOTON = 'flex items-center justify-center size-9 rounded-full border border-transparent transition-all cursor-pointer';
const SECUNDARIO = `${BOTON} bg-[#EAEFFA] text-purple-deep hover:border-purple disabled:opacity-40`;
const metros = (valor) => (Number.isFinite(valor) ? `${formatNumber(Math.round(valor))} m` : 'Sin dato');

const Fila = ({ etiqueta, valor, nueva }) => (
    <div className="flex items-baseline justify-between gap-3 text-[13px] text-[#465055]">
        <span>{etiqueta}</span>
        <strong className={`font-semibold tabular-nums ${nueva ? 'text-[#5C2472]' : 'text-[#1A1A1A]'}`}>{valor}</strong>
    </div>
);

const Resultado = ({ resultado, calculando, modo }) => {
    if (!resultado) {
        const pista = { punto: 'Haz clic sobre el terreno', linea: 'Haz clic para agregar puntos; doble clic termina', poligono: 'Agrega al menos tres puntos; doble clic termina' };
        return <p className="text-[13px] text-[#7B8388]">{calculando ? 'Calculando…' : pista[modo]}</p>;
    }
    if (resultado.modo === 'punto') return <Fila etiqueta="Altura sobre el nivel del mar" valor={metros(resultado.alt)} nueva />;
    if (resultado.modo === 'linea') {
        return (
            <>
                <Fila etiqueta="En línea recta" valor={formatLengthValue(resultado.plano)} />
                <Fila etiqueta="Siguiendo el terreno" valor={formatLengthValue(resultado.superficie)} nueva />
                <Fila etiqueta="Subida acumulada" valor={`+${metros(resultado.sube)}`} nueva />
                <Fila etiqueta="Bajada acumulada" valor={`−${metros(resultado.baja)}`} nueva />
                <Fila etiqueta="Altura máx. / mín." valor={`${metros(resultado.max)} / ${metros(resultado.min)}`} nueva />
            </>
        );
    }
    return (
        <>
            <Fila etiqueta="Área vista desde arriba" valor={formatAreaValue(resultado.plano)} />
            <Fila etiqueta="Área sobre el relieve" valor={formatAreaValue(resultado.superficie)} nueva />
            <Fila etiqueta="Perímetro" valor={formatLengthValue(resultado.perimetro)} />
        </>
    );
};

const Medicion3D = ({ map }) => {
    const { hideMeasurementTools } = useMapsContext();
    const { style, className } = useSiderAdaptivePosition({ anchorRef: 'tools' });
    const { modo, setModo, vertices, resultado, calculando, deshacer, borrar, setMarcador } = useMedicion3d(map);
    const conPerfil = resultado?.modo === 'linea' && resultado.perfil.length > 1;

    return (
        <div className={`fixed z-10 flex flex-col gap-2 items-start ${className}`} style={style}>
            <div className="flex items-center gap-1.5 rounded-full bg-white p-1.5 shadow-[0_5px_20px_#1A26641A]" role="toolbar" aria-label="Mediciones en 3D">
                {HERRAMIENTAS.map(({ id, icono, label }) => (
                    <Tooltip key={id} content={label}>
                        <button
                            type="button"
                            onClick={() => setModo(id)}
                            aria-pressed={modo === id}
                            aria-label={label}
                            className={`${BOTON} ${modo === id ? 'bg-purple-deep text-white' : 'bg-[#EAEFFA] text-purple-deep hover:border-purple'}`}
                        >
                            <Icon name={icono} state={modo === id ? 'hover' : 'normal'} className="size-5" />
                        </button>
                    </Tooltip>
                ))}
                <Tooltip content="Deshacer el último punto">
                    <button type="button" onClick={deshacer} disabled={!vertices.length} aria-label="Deshacer el último punto" className={SECUNDARIO}>
                        <Icon name="undo" className="size-5" />
                    </button>
                </Tooltip>
                <Tooltip content="Borrar la medición">
                    <button type="button" onClick={borrar} disabled={!vertices.length} aria-label="Borrar la medición" className={SECUNDARIO}>
                        <Icon name="eliminar" className="size-5" />
                    </button>
                </Tooltip>
                <Tooltip content="Cerrar mediciones">
                    <button type="button" onClick={hideMeasurementTools} aria-label="Cerrar mediciones" className={SECUNDARIO}>
                        <Icon name="close" className="size-4" />
                    </button>
                </Tooltip>
            </div>
            <div className="flex w-[300px] flex-col gap-2 rounded-[14px] bg-white p-3 shadow-[0_5px_20px_#1A26641A]">
                <Resultado resultado={resultado} calculando={calculando} modo={modo} />
                {conPerfil && (
                    <div className="mt-2">
                        <span className="text-[12px] font-semibold text-[#1A1A1A]">Perfil de elevación</span>
                        <PerfilElevacion perfil={resultado.perfil} onRecorrer={setMarcador} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default Medicion3D;

import Icon from '@components/Icon';
import PanelHeader from '@components/PanelHeader';
import PillCloseButton from '@components/PillCloseButton';
import { formatAreaValue, formatLengthValue } from '@pages/maps/helpers/formatMeasure';
import { formatNumber } from '@pages/maps/helpers/formatNumber';
import PerfilElevacion from './PerfilElevacion';
import DistribucionAlturas from './DistribucionAlturas';

const ENCABEZADOS = {
    punto: { titulo: 'Altura del punto', icono: 'geom_point' },
    linea: { titulo: 'Distancia', icono: 'linea' },
    poligono: { titulo: 'Área', icono: 'poligono' },
};

const PISTAS = {
    punto: 'Haz clic sobre el terreno',
    linea: 'Haz clic para agregar puntos; doble clic termina',
    poligono: 'Agrega al menos tres puntos; doble clic termina',
};

const metros = (valor) => (Number.isFinite(valor) ? `${formatNumber(Math.round(valor))} m` : 'Sin dato');

const Fila = ({ etiqueta, valor, nueva }) => (
    <div className="flex items-baseline justify-between gap-3 font-garet text-[13px]/[18px] text-graphite">
        <span>{etiqueta}</span>
        <strong className={`font-bold tabular-nums whitespace-nowrap ${nueva ? 'text-purple-deep' : 'text-graphite'}`}>{valor}</strong>
    </div>
);

const Filas = ({ resultado }) => {
    if (resultado.modo === 'punto') return <Fila etiqueta="Altura sobre el nivel del mar" valor={metros(resultado.alt)} nueva />;
    if (resultado.modo === 'linea') {
        return (
            <>
                <Fila etiqueta="En línea recta" valor={formatLengthValue(resultado.plano)} />
                <Fila etiqueta="Siguiendo el terreno" valor={formatLengthValue(resultado.superficie)} nueva />
                <Fila etiqueta="Subida acumulada" valor={`+${metros(resultado.sube)}`} nueva />
                <Fila etiqueta="Bajada acumulada" valor={`−${metros(resultado.baja)}`} nueva />
                <Fila etiqueta="Máx. / mín." valor={`${metros(resultado.max)} / ${metros(resultado.min)}`} nueva />
            </>
        );
    }
    return (
        <>
            <Fila etiqueta="Área vista desde arriba" valor={formatAreaValue(resultado.plano)} />
            <Fila etiqueta="Área sobre el relieve" valor={formatAreaValue(resultado.superficie)} nueva />
            <Fila etiqueta="Perímetro" valor={formatLengthValue(resultado.perimetro)} />
            {resultado.distribucion && (
                <Fila etiqueta="Máx. / mín." valor={`${metros(resultado.max)} / ${metros(resultado.min)}`} nueva />
            )}
        </>
    );
};

const PanelMedicion = ({ modo, resultado, calculando, onCerrar, onRecorrer, ancho = 'w-[300px]', className = '' }) => {
    const encabezado = ENCABEZADOS[resultado?.modo || modo];
    if (!encabezado) return null;
    const conPerfil = resultado?.modo === 'linea' && resultado.perfil.length > 1;

    return (
        <section className={`flex ${ancho} max-md:max-w-[calc(100vw-5rem)] flex-col gap-2 rounded-[12px] bg-[#F9FBFF] px-4.5 pb-3 pt-2 shadow-[0_5px_20px_#1A26641A] ${className}`} aria-label={encabezado.titulo}>
            <PanelHeader
                icono={<Icon name={encabezado.icono} className="size-5 shrink-0" />}
                titulo={encabezado.titulo}
                acciones={onCerrar && (
                    <PillCloseButton onClick={onCerrar} size="sm" reveal="siempre" tooltip="Cerrar resultados" ariaLabel="Cerrar resultados de la medición" />
                )}
            />
            <div className="flex flex-col gap-1.5 rounded-[7px] bg-white p-3">
                {resultado ? <Filas resultado={resultado} /> : (
                    <p className="font-garet text-[13px] text-[#7B8388]">{calculando ? 'Calculando…' : PISTAS[modo]}</p>
                )}
                {conPerfil && (
                    <div className="mt-2">
                        <span className="font-garet font-bold text-[12px] text-graphite">Perfil de elevación</span>
                        <PerfilElevacion perfil={resultado.perfil} onRecorrer={onRecorrer || (() => {})} />
                    </div>
                )}
                {resultado?.distribucion && (
                    <div className="mt-2 flex flex-col gap-1.5">
                        <span className="font-garet font-bold text-[12px] text-graphite">Alturas dentro del área</span>
                        <DistribucionAlturas distribucion={resultado.distribucion} />
                    </div>
                )}
            </div>
        </section>
    );
};

export default PanelMedicion;

import { useRef, useState } from 'react';
import Icon from '@components/Icon';
import Panel from '@components/Panel';
import Checkbox from '@components/Checkbox';
import ActionIconButton from '@components/ActionIconButton';
import { FORMATOS_TABLA, construirDescarga } from '@services/tablaDescarga';
import { findVectorFormat } from '@services/downloadUrls';

const DescargaTabla = ({ wmsConfig, cql, columnas, campoGeometria, nombreCapa, total }) => {
    const anclaRef = useRef(null);
    const [abierto, setAbierto] = useState(false);
    const [soloVisibles, setSoloVisibles] = useState(true);

    const descargar = (formatoId) => {
        const descarga = construirDescarga({
            wmsConfig, formatoId, cql, columnas, soloVisibles, campoGeometria, nombreCapa,
        });
        if (!descarga) return;

        const enlace = document.createElement('a');
        enlace.href = descarga.url;
        enlace.download = descarga.archivo;
        enlace.rel = 'noopener';
        document.body.appendChild(enlace);
        enlace.click();
        enlace.remove();
        setAbierto(false);
    };

    const ocultas = (columnas || []).filter(columna => !columna.visible).length;

    return (
        <span ref={anclaRef} className="flex">
            <ActionIconButton
                onClick={() => setAbierto(valor => !valor)}
                titulo="Descargar lo que muestra la tabla: baja los registros con los filtros puestos, no la capa completa"
                etiqueta="Descargar los datos de la tabla"
                tamano="sm"
            >
                <Icon name="download" className="size-3.5" />
            </ActionIconButton>

            <Panel
                open={abierto}
                anchorRef={anclaRef}
                onClose={() => setAbierto(false)}
                placement="bottom-end"
                width="w-64"
                noPadding
                hideHeader
                className="z-50"
            >
                <div className="p-3 flex flex-col gap-2.5">
                    <span className="text-[12px] font-garet font-bold text-purple">Descargar</span>

                    <p className="text-[11px]/[15px] font-garet text-[#6B7585]">
                        {Number.isFinite(total)
                            ? `${total.toLocaleString('es-MX')} registros con los filtros puestos.`
                            : 'Los registros con los filtros puestos.'}
                    </p>

                    {ocultas > 0 && (
                        <div
                            role="button"
                            tabIndex={0}
                            onClick={() => setSoloVisibles(valor => !valor)}
                            onKeyDown={evento => {
                                if (evento.key === 'Enter' || evento.key === ' ') setSoloVisibles(valor => !valor);
                            }}
                            className="flex items-center text-[12px] font-garet text-graphite hover:text-purple cursor-pointer"
                        >
                            <Checkbox checked={soloVisibles} />
                            <span>Solo las columnas visibles</span>
                        </div>
                    )}

                    <div className="flex flex-col gap-1.5">
                        {FORMATOS_TABLA.map(formatoId => {
                            const formato = findVectorFormat(formatoId);
                            return (
                                <button
                                    key={formatoId}
                                    type="button"
                                    onClick={() => descargar(formatoId)}
                                    className="h-8 px-3 flex items-center justify-between rounded-full border border-[#EAEFFA] text-[12px] font-garet text-graphite hover:border-purple hover:text-purple cursor-pointer"
                                >
                                    <span>{formato.label}</span>
                                    <span className="text-[10px] text-[#8A94A6]">
                                        {formatoId === 'csv' ? 'la tabla tal cual' : 'con geometría, para QGIS'}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </Panel>
        </span>
    );
};

export default DescargaTabla;

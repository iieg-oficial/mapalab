import { useEffect, useMemo, useState } from 'react';
import Modal from '@components/Modal';
import Segmented from '@components/Segmented';
import Checkbox from '@components/Checkbox';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { useMapsContext } from '@hooks/useMaps';
import { useView3d } from '@contexts/View3dContext';
import { useMapDownload } from '@mapsComponents/MapExport/hooks/useMapDownload';
import { useSeleccionDescarga } from '@mapsComponents/MapExport/hooks/useSeleccionDescarga';
import QualitySelector from '@mapsComponents/MapExport/QualitySelector';
import { QUALITY_PRESETS } from '@mapsComponents/MapExport/utils/exportDimensions';
import { VISTA_ANALITICA, opcionesFormato, opcionesVista } from '@mapsComponents/MapExport/utils/opcionesDescarga';
import { trackMapExport } from '@services/analyticsService';
import { BOTON_PRIMARIO, ETIQUETA, INPUT } from '../helpers/controles';

const TOOLTIP_AREA = 'Descarga lo que ves en el mapa';

const CatalogoDescargaImagen = ({ abierto, capa, onCerrar }) => {
    const { measurements } = useMapsContext();
    const { active: en3d } = useView3d();
    const { downloadMap, isDownloading, canDownload, layersWithLegends } = useMapDownload();
    const { geometria: seleccion, trazos } = useSeleccionDescarga(measurements || []);
    const [formato, setFormato] = useState('png');
    const [vista, setVista] = useState('viewport');
    const [calidad, setCalidad] = useState(1);
    const [titulo, setTitulo] = useState(capa?.nombre || 'Mapa');
    const [conLeyenda, setConLeyenda] = useState(true);

    useEffect(() => {
        setTitulo(capa?.nombre || 'Mapa');
    }, [capa]);

    const vistas = useMemo(
        () => opcionesVista({ haySeleccion: !!seleccion, isSwipe: false, es3d: en3d })
            .map((v) => (v.value === 'viewport' ? { ...v, tooltip: TOOLTIP_AREA } : v)),
        [seleccion, en3d],
    );

    useEffect(() => {
        if (!vistas.some((v) => v.value === vista)) setVista('viewport');
    }, [vistas, vista]);

    const descargar = async () => {
        const preset = QUALITY_PRESETS[calidad];
        const leyendas = conLeyenda ? layersWithLegends.slice(0, 1) : [];
        trackMapExport(formato, preset.label, VISTA_ANALITICA[vista]);
        await downloadMap(formato, leyendas, vista, titulo.trim() || capa?.nombre || 'Mapa', null, preset, null, { geometria: seleccion, trazos });
        onCerrar();
    };

    return (
        <Modal isOpen={abierto} onClose={onCerrar} showHeader={false} width="max-w-sm">
            <div className="px-6 pt-5 pb-6 font-garet flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[18px] font-bold text-[#5C2472]">Descargar imagen</h3>
                    <MobileSheetCloseButton onClick={onCerrar} />
                </div>

                <div>
                    <span className={ETIQUETA}>Formato</span>
                    <Segmented options={opcionesFormato(false)} value={formato} onChange={setFormato} ariaLabel="Formato de la imagen" />
                </div>

                <div>
                    <span className={ETIQUETA}>Qué parte del mapa</span>
                    <Segmented options={vistas} value={vista} onChange={setVista} ariaLabel="Parte del mapa" />
                </div>

                <div>
                    <span className={ETIQUETA}>Calidad</span>
                    <QualitySelector value={calidad} onChange={setCalidad} isPanelOpen={abierto} />
                </div>

                <div>
                    <label className={ETIQUETA} htmlFor="catalogo-imagen-titulo">Título</label>
                    <input
                        id="catalogo-imagen-titulo"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value.slice(0, 120))}
                        className={INPUT}
                    />
                </div>

                {layersWithLegends.length > 0 && (
                    <span className="inline-flex items-center gap-2 font-garet text-[13px] text-[#465055]">
                        <Checkbox checked={conLeyenda} onChange={() => setConLeyenda((v) => !v)} />
                        Incluir la leyenda
                    </span>
                )}

                <button
                    type="button"
                    onClick={descargar}
                    disabled={!canDownload || isDownloading}
                    className={`${BOTON_PRIMARIO} self-start`}
                >
                    {isDownloading ? 'Generando…' : `Descargar ${formato.toUpperCase()}`}
                </button>
            </div>
        </Modal>
    );
};

export default CatalogoDescargaImagen;

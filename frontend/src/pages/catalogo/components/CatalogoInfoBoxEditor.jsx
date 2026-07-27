import { useCallback, useEffect, useMemo, useState } from 'react';
import Modal from '@components/Modal';
import LottieSpinner from '@components/LottieSpinner';
import ScrollContainer from '@components/ScrollContainer';
import CatalogoInfoBoxPropuestaForm from './CatalogoInfoBoxPropuestaForm';
import { FieldChip, Zone } from './CatalogoInfoBoxZone';
import { hydrateWmsConfig } from '@pages/maps/helpers/wmsConfig';
import { renderCard } from '@pages/maps/components/InfoBox/utils/renderCard.jsx';
import { fetchNonGeometryColumns } from '@services/downloadUrls';
import { fetchCapaSampleFeature, postInfoboxPropuesta } from '@services/catalogoService';
import { trackCatalogoInfoboxPropuesta } from '@services/analyticsService';
import {
    addField,
    availableFields,
    draftFromConfig,
    draftHasBlankLabel,
    draftIsEmpty,
    draftToConfig,
    removeField,
    renameField,
    reorderZone,
} from '../helpers/infoboxDraft';

const ZONES = [
    { id: 'header', titulo: 'Título', ayuda: 'Un solo campo, en grande arriba de la tarjeta.' },
    { id: 'cards', titulo: 'Cifras', ayuda: 'Números destacados en cajas.' },
    { id: 'list', titulo: 'Detalles', ayuda: 'Filas de etiqueta y valor.' },
];

const CatalogoInfoBoxEditor = ({ capa, featureMuestra = null, onClose }) => {
    const [columns, setColumns] = useState(null);
    const [feature, setFeature] = useState(featureMuestra);
    const [draft, setDraft] = useState(() => draftFromConfig(capa?.littleCard));
    const [paso, setPaso] = useState('editor');
    const [comentario, setComentario] = useState('');
    const [website, setWebsite] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const ctrl = new AbortController();
        const cfg = hydrateWmsConfig({
            geoserverWorkspace: capa.geoserverWorkspace,
            geoserverLayer: capa.geoserverLayer,
        });
        fetchNonGeometryColumns(cfg, ctrl.signal)
            .then((cols) => setColumns(cols || []))
            .catch(() => setColumns([]));
        if (!featureMuestra) {
            fetchCapaSampleFeature(capa, ctrl.signal)
                .then(setFeature)
                .catch(() => setFeature(null));
        }
        return () => ctrl.abort();
    }, [capa, featureMuestra]);

    const disponibles = useMemo(() => availableFields(columns, draft), [columns, draft]);

    const preview = useMemo(() => {
        if (!feature) return null;
        return renderCard(
            feature.properties,
            draftToConfig(draft),
            null,
            capa.geoserverLayer,
            feature.id,
            null,
            'desktop',
            1,
            1,
            null,
        );
    }, [feature, draft, capa]);

    const handleDrop = useCallback((zone, field) => setDraft((d) => addField(d, zone, field)), []);
    const handleRemove = useCallback((zone, field) => setDraft((d) => removeField(d, zone, field)), []);
    const handleRename = useCallback((zone, field, label) => setDraft((d) => renameField(d, zone, field, label)), []);
    const handleMove = useCallback((zone, from, to) => setDraft((d) => reorderZone(d, zone, from, to)), []);

    const vacio = draftIsEmpty(draft);
    const faltanEtiquetas = draftHasBlankLabel(draft);

    const handleEnviar = async () => {
        setEnviando(true);
        setError(null);
        try {
            await postInfoboxPropuesta({
                capaSlug: capa.slug,
                config: draftToConfig(draft),
                comentario: comentario.trim() || null,
                website,
            });
            trackCatalogoInfoboxPropuesta({ slug: capa.slug, campos: draft.list.length + draft.cards.length });
            setPaso('enviado');
        } catch (e) {
            setError(e.message);
        } finally {
            setEnviando(false);
        }
    };

    return (
        <Modal isOpen onClose={onClose} showHeader={false} width="max-w-4xl">
            <div className="px-6 pt-5 pb-6 font-garet">
                <div className="flex items-start justify-between gap-4 mb-1">
                    <h3 className="text-[20px] font-bold text-purple">Personalizar la tarjeta</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Cerrar"
                        className="shrink-0 -mr-1.5 p-1.5 rounded-full text-[#6E7477] hover:text-purple hover:bg-purple-soft transition-colors cursor-pointer"
                    >
                        <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <p className="text-[13px] text-[#6E7477] mb-4">
                    <span className="font-bold text-orange">{capa.nombre}</span>
                    {' · '}Elige qué datos aparecen al hacer clic en el mapa. Tu propuesta pasa a revisión del IIEG antes de publicarse.
                </p>

                {paso === 'enviado' ? (
                    <div className="py-8 text-center">
                        <p className="text-[16px] font-bold text-purple mb-2">¡Gracias! Tu propuesta ya está en revisión.</p>
                        <p className="text-[13px] text-[#6E7477] mb-6">
                            El equipo del IIEG la revisará antes de publicarla.
                        </p>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2 rounded-[30px] text-[13px] font-bold bg-purple-deep text-white hover:bg-purple transition-colors cursor-pointer"
                        >
                            Cerrar
                        </button>
                    </div>
                ) : paso === 'formulario' ? (
                    <CatalogoInfoBoxPropuestaForm
                        comentario={comentario}
                        onComentario={setComentario}
                        website={website}
                        onWebsite={setWebsite}
                        enviando={enviando}
                        error={error}
                        onEnviar={handleEnviar}
                        onRegresar={() => setPaso('editor')}
                    />
                ) : (
                    <>
                        <div className="grid md:grid-cols-[1fr_240px] gap-5">
                            <div className="min-w-0 flex flex-col gap-3">
                                <div>
                                    <p className="text-[12px] font-bold text-purple mb-2">Campos disponibles</p>
                                    {columns === null ? (
                                        <div className="flex items-center gap-2 py-2">
                                            <LottieSpinner loop autoplay className="w-8 h-8" />
                                            <span className="text-[12px] text-[#6E7477]">Cargando campos…</span>
                                        </div>
                                    ) : disponibles.length === 0 ? (
                                        <p className="text-[12px] text-[#A8A2B0] py-1">
                                            {columns.length ? 'Ya usaste todos los campos.' : 'No se pudieron leer los campos de esta capa.'}
                                        </p>
                                    ) : (
                                        <ScrollContainer className="max-h-28 flex flex-wrap gap-1.5" itemCount={disponibles.length}>
                                            {disponibles.map((field) => (
                                                <FieldChip key={field} field={field} onAdd={(f) => handleDrop('list', f)} />
                                            ))}
                                        </ScrollContainer>
                                    )}
                                </div>

                                {ZONES.map((zone) => (
                                    <Zone
                                        key={zone.id}
                                        zone={zone}
                                        draft={draft}
                                        onDrop={handleDrop}
                                        onRemove={handleRemove}
                                        onRename={handleRename}
                                        onMove={handleMove}
                                    />
                                ))}
                            </div>

                            <div className="min-w-0">
                                <p className="text-[12px] font-bold text-purple mb-2">Vista previa</p>
                                {feature === null ? (
                                    <p className="text-[12px] text-[#A8A2B0]">
                                        No se pudo traer un registro de ejemplo, pero tu propuesta se puede enviar igual.
                                    </p>
                                ) : vacio ? (
                                    <p className="text-[12px] text-[#A8A2B0]">Agrega campos para ver cómo queda.</p>
                                ) : (
                                    <div className="w-[239px] max-w-full">{preview}</div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-5">
                            <button
                                type="button"
                                onClick={() => setPaso('formulario')}
                                disabled={vacio || faltanEtiquetas}
                                className="px-5 py-2 rounded-[30px] text-[13px] font-bold bg-purple-deep text-white hover:bg-purple transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                            >
                                Continuar
                            </button>
                            <button
                                type="button"
                                onClick={() => setDraft(draftFromConfig(capa?.littleCard))}
                                className="px-5 py-2 rounded-[30px] text-[13px] font-bold border border-purple-deep text-purple-deep hover:bg-purple-soft transition-colors cursor-pointer"
                            >
                                Restaurar
                            </button>
                            {faltanEtiquetas && (
                                <span className="text-[12px] text-orange">Ponle nombre a cada campo antes de continuar.</span>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default CatalogoInfoBoxEditor;

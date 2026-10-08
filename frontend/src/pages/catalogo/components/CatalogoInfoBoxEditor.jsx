import { useEffect, useMemo, useState } from 'react';
import Modal from '@components/Modal';
import Tooltip from '@components/Tooltip';
import Icon from '@components/Icon';
import ActionIconButton from '@components/ActionIconButton';
import { MobileSheetCloseButton } from '@components/MobileSheet';
import { buildCardPlan } from '@utils/infoboxPlan';
import { hydrateWmsConfig } from '@pages/maps/helpers/wmsConfig';
import { fetchNonGeometryColumns } from '@services/downloadUrls';
import { fetchCapaSampleFeatures, postInfoboxPropuesta } from '@services/catalogoService';
import { trackCatalogoInfoboxPropuesta } from '@services/analyticsService';
import CatalogoInfoBoxPropuestaForm from './CatalogoInfoBoxPropuestaForm';
import Lienzo from './tarjeta/Lienzo';
import PanelTitulo from './tarjeta/PanelTitulo';
import PanelBloque from './tarjeta/PanelBloque';
import { IconoAbajo, IconoDeshacer, IconoRehacer } from './tarjeta/iconos';
import { useHistorial } from '../hooks/useHistorial';
import { BOTON_CONTORNO, BOTON_ICONO, BOTON_PRIMARIO, ERROR } from '../helpers/controles';
import { fusionarConfig, ordenFusionado } from '../helpers/tarjetaFusion';
import * as op from '../helpers/tarjetaModelo';

const Muestras = ({ total, indice, onCambio }) => (total > 1 ? (
    <div className="flex items-center gap-1 font-garet text-[12px] text-[#6E7477]">
        <button type="button" onClick={() => onCambio(indice - 1)} disabled={indice === 0} aria-label="Registro anterior" className={BOTON_ICONO}>
            <IconoAbajo className="size-4 rotate-90" />
        </button>
        <span className="tabular-nums">{`Registro ${indice + 1} de ${total}`}</span>
        <button type="button" onClick={() => onCambio(indice + 1)} disabled={indice === total - 1} aria-label="Registro siguiente" className={BOTON_ICONO}>
            <IconoAbajo className="size-4 -rotate-90" />
        </button>
    </div>
) : null);

const CatalogoInfoBoxEditor = ({ capa, featureMuestra = null, onClose }) => {
    const base = capa?.littleCard || null;
    const { valor: modelo, aplicar, deshacer, rehacer, puedeDeshacer, puedeRehacer } = useHistorial(() => op.modeloDesdeConfig(base));
    const [seleccion, setSeleccion] = useState('titulo');
    const [columnas, setColumnas] = useState(null);
    const [muestras, setMuestras] = useState(featureMuestra ? [featureMuestra] : []);
    const [indice, setIndice] = useState(0);
    const [paso, setPaso] = useState('editor');
    const [comentario, setComentario] = useState('');
    const [email, setEmail] = useState('');
    const [website, setWebsite] = useState('');
    const [enviando, setEnviando] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const ctrl = new AbortController();
        const cfg = hydrateWmsConfig({ geoserverWorkspace: capa.geoserverWorkspace, geoserverLayer: capa.geoserverLayer });
        fetchNonGeometryColumns(cfg, ctrl.signal).then((cols) => setColumnas(cols || [])).catch(() => setColumnas([]));
        fetchCapaSampleFeatures(capa, ctrl.signal)
            .then((features) => setMuestras((previas) => {
                const ids = new Set(previas.map((f) => f.id));
                return [...previas, ...features.filter((f) => !ids.has(f.id))].slice(0, 5);
            }))
            .catch(() => {});
        return () => ctrl.abort();
    }, [capa]);

    const propuesta = useMemo(() => op.configDesdeModelo(modelo), [modelo]);
    const problemas = useMemo(() => op.problemasDe(modelo), [modelo]);
    const feature = muestras[indice] || null;
    const plan = useMemo(
        () => buildCardPlan(feature?.properties || {}, fusionarConfig(base, propuesta), {
            layerId: capa.geoserverLayer,
            featureId: feature?.id ?? null,
            variant: 'desktop',
        }),
        [base, capa.geoserverLayer, feature, propuesta],
    );
    const orden = useMemo(() => ordenFusionado(base, { blockOrder: modelo.bloques.map((b) => b.key) }), [base, modelo.bloques]);

    const acciones = {
        agregarItem: (key, item) => aplicar((m) => op.agregarItem(m, key, item)),
        actualizarItem: (key, uid, parche) => aplicar((m) => op.actualizarItem(m, key, uid, parche)),
        quitarItem: (key, uid) => aplicar((m) => op.quitarItem(m, key, uid)),
        moverItem: (key, uid, delta) => aplicar((m) => op.moverItem(m, key, uid, delta)),
        moverBloque: (key, delta) => aplicar((m) => op.moverBloque(m, key, delta)),
        quitarBloque: (key) => {
            aplicar((m) => op.quitarBloque(m, key));
            setSeleccion('titulo');
        },
    };

    const agregarBloque = (tipo) => {
        const resultado = op.agregarBloque(modelo, tipo);
        if (!resultado.key) return;
        aplicar(resultado.modelo);
        setSeleccion(resultado.key);
    };

    const restaurar = () => {
        aplicar(op.modeloDesdeConfig(base));
        setSeleccion('titulo');
    };

    const handleEnviar = async () => {
        setEnviando(true);
        setError(null);
        try {
            await postInfoboxPropuesta({ capaSlug: capa.slug, config: propuesta, comentario: comentario.trim() || null, email: email.trim() || null, website });
            trackCatalogoInfoboxPropuesta({ slug: capa.slug, campos: modelo.bloques.reduce((n, b) => n + b.items.length, 0) });
            setPaso('enviado');
        } catch (e) {
            setError(e.message);
        } finally {
            setEnviando(false);
        }
    };

    const indiceBloque = modelo.bloques.findIndex((b) => b.key === seleccion);
    const bloque = modelo.bloques[indiceBloque] || null;

    return (
        <Modal isOpen onClose={onClose} showHeader={false} width={paso === 'editor' ? 'max-w-5xl' : 'max-w-lg'}>
            <div className="px-6 pt-5 pb-6 font-garet">
                <div className="flex items-center gap-2 mb-5">
                    {paso === 'formulario' && (
                        <ActionIconButton onClick={() => setPaso('editor')} titulo="Volver a la tarjeta" etiqueta="Volver a la tarjeta">
                            <Icon name="chevron" className="size-3.5 rotate-90" />
                        </ActionIconButton>
                    )}
                    <div className="flex-1 min-w-0 flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                        <h3 className="text-[20px] font-bold text-[#5C2472]">Personalizar la tarjeta</h3>
                        <span className="text-[13px] font-bold text-[#FF8300] truncate">{capa.nombre}</span>
                    </div>
                    {paso === 'editor' && (
                        <>
                            <Tooltip content="Deshacer" placement="bottom" delay={200}>
                                <button type="button" onClick={deshacer} disabled={!puedeDeshacer} aria-label="Deshacer" className={BOTON_ICONO}><IconoDeshacer /></button>
                            </Tooltip>
                            <Tooltip content="Rehacer" placement="bottom" delay={200}>
                                <button type="button" onClick={rehacer} disabled={!puedeRehacer} aria-label="Rehacer" className={BOTON_ICONO}><IconoRehacer /></button>
                            </Tooltip>
                        </>
                    )}
                    <MobileSheetCloseButton onClick={onClose} />
                </div>

                {paso === 'enviado' ? (
                    <div className="py-8 text-center">
                        <p className="text-[16px] font-bold text-[#5C2472] mb-2">¡Gracias! Tu propuesta ya está en revisión.</p>
                        <p className="text-[13px] text-[#6E7477] mb-6">El equipo del IIEG la revisará antes de publicarla.</p>
                        <button type="button" onClick={onClose} className={BOTON_PRIMARIO}>Cerrar</button>
                    </div>
                ) : paso === 'formulario' ? (
                    <CatalogoInfoBoxPropuestaForm
                        comentario={comentario}
                        onComentario={setComentario}
                        email={email}
                        onEmail={setEmail}
                        website={website}
                        onWebsite={setWebsite}
                        enviando={enviando}
                        error={error}
                        onEnviar={handleEnviar}
                    />
                ) : (
                    <>
                        <div className="grid md:grid-cols-[300px_1fr] gap-6">
                            <div className="flex flex-col items-center gap-2 md:sticky md:top-0 md:self-start">
                                <Lienzo
                                    plan={plan}
                                    orden={orden}
                                    modelo={modelo}
                                    seleccion={seleccion}
                                    problemas={problemas}
                                    onSeleccionar={setSeleccion}
                                    onAgregarBloque={agregarBloque}
                                    puedeAgregar={(tipo) => op.puedeAgregarBloque(modelo, tipo)}
                                />
                                <Muestras total={muestras.length} indice={indice} onCambio={setIndice} />
                            </div>
                            <div className="min-w-0">
                                {seleccion === 'titulo' && (
                                    <>
                                        <h4 className="mb-3 font-garet font-bold text-[15px] text-[#5C2472]">Título</h4>
                                        <PanelTitulo
                                            titulo={modelo.titulo}
                                            columnas={columnas}
                                            problema={problemas.titulo}
                                            onCambio={(titulo) => aplicar((m) => op.fijarTitulo(m, titulo))}
                                        />
                                    </>
                                )}
                                {bloque && (
                                    <PanelBloque
                                        bloque={bloque}
                                        columnas={columnas}
                                        problemas={problemas.porItem}
                                        primero={indiceBloque === 0}
                                        ultimo={indiceBloque === modelo.bloques.length - 1}
                                        acciones={acciones}
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mt-6">
                            <button type="button" onClick={() => setPaso('formulario')} disabled={problemas.hay} className={BOTON_PRIMARIO}>Continuar</button>
                            <button type="button" onClick={restaurar} className={BOTON_CONTORNO}>Restaurar</button>
                            {problemas.hay && (
                                <p className={`${ERROR} mt-0`}>
                                    {problemas.vacia ? 'La tarjeta necesita al menos un dato.' : 'Revisa lo marcado en rojo.'}
                                </p>
                            )}
                        </div>
                    </>
                )}
            </div>
        </Modal>
    );
};

export default CatalogoInfoBoxEditor;

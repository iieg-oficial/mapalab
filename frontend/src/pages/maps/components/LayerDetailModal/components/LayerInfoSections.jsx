const InfoSection = ({ title, children }) => (
    <div className="bg-[#F9FBFF] rounded-[11px] px-7 py-4">
        <span className="block text-[14px]/[47px] font-garet font-bold text-[#5C2472] tracking-normal">
            {title}
        </span>
        {children}
    </div>
);

const TextBlock = ({ text }) => (
    <p className="text-[12px]/[18px] text-left font-garet font-medium text-[#454545] tracking-normal">
        {text}
    </p>
);

const ExternalLink = ({ href, label }) => {
    if (!href?.startsWith('https://') && !href?.startsWith('http://')) return null;
    return (
        <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-[12px]/[18px] font-garet font-medium text-[#5C2472] underline">
            {label}
        </a>
    );
};

const normalizeFuentes = (metadata) => {
    if (Array.isArray(metadata.fuentes) && metadata.fuentes.length > 0) return metadata.fuentes;
    if (!metadata.fuentes_texto_largo && !metadata.fuentes_enlace && !metadata.fuentes_texto_corto) return [];
    const links = (metadata.fuentes_enlace || '').split(',').map(l => l.trim()).filter(Boolean);
    if (links.length <= 1) {
        return [{
            corto: metadata.fuentes_texto_corto,
            largo: metadata.fuentes_texto_largo,
            enlace: metadata.fuentes_enlace,
        }];
    }
    return links.map((enlace, i) => ({
        largo: i === 0 ? metadata.fuentes_texto_largo : null,
        enlace,
    }));
};

const normalizeMetodologia = (metadata) => {
    if (Array.isArray(metadata.metodologia) && metadata.metodologia.length > 0) return metadata.metodologia;
    if (!metadata.metodologia_texto && !metadata.metodologia_archivo_enlace) return [];
    return [{
        texto: metadata.metodologia_texto,
        archivo_enlace: metadata.metodologia_archivo_enlace,
    }];
};

const LayerInfoSections = ({ metadata, layerName }) => {
    if (!metadata) return null;

    const fuentes = normalizeFuentes(metadata);
    const metodologia = normalizeMetodologia(metadata);

    return (
        <div className="flex flex-col gap-4">
            {fuentes.length > 0 && (
                <InfoSection title={fuentes.length > 1 ? 'Fuentes' : 'Fuente'}>
                    <div className="flex flex-col gap-3">
                        {fuentes.map((f, i) => {
                            const fallbackLabel = fuentes.length <= 1 ? 'Ver fuente' : `Fuente ${i + 1}`;
                            const label = f.enlace_label || f.corto || fallbackLabel;
                            return (
                                <div key={i} className="flex flex-col gap-1">
                                    {f.largo && <TextBlock text={f.largo} />}
                                    {f.enlace && <ExternalLink href={f.enlace} label={label} />}
                                </div>
                            );
                        })}
                    </div>
                </InfoSection>
            )}
            {metodologia.length > 0 && (
                <InfoSection title={metodologia.length > 1 ? 'Metodologías' : 'Metodología'}>
                    <div className="flex flex-col gap-3">
                        {metodologia.map((m, i) => (
                            <div key={i} className="flex flex-col gap-1">
                                {m.texto && <TextBlock text={m.texto} />}
                                {m.archivo_enlace && (
                                    <ExternalLink
                                        href={m.archivo_enlace}
                                        label={metodologia.length > 1 ? `Ver documento ${i + 1}` : 'Ver documento'}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </InfoSection>
            )}
            {(metadata.texto_leyenda_juridico || metadata.tipo_mapa) && (
                <InfoSection title="Referencia cartográfica del límite municipal">
                    {metadata.texto_leyenda_juridico && <TextBlock text={metadata.texto_leyenda_juridico} />}
                    {metadata.tipo_mapa && (
                        <div className="flex flex-col gap-2 mt-1">
                            <span className="text-[12px]/[18px] font-garet font-medium text-[#454545]">
                                <span className="font-garet font-bold">Tipo de mapa:</span> {metadata.tipo_mapa}
                            </span>
                            <ExternalLink href={metadata.tipo_mapa_enlace} label="Ver documento" />
                        </div>
                    )}
                </InfoSection>
            )}
            {metadata.metadato?.length > 0 && (
                <InfoSection title="Metadato">
                    <div className="flex flex-col gap-1">
                        {metadata.metadato.map((doc, index) => {
                            const extensionMatch = doc.enlace?.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
                            const extension = extensionMatch ? `.${extensionMatch[1]}` : '';
                            const nameWithExt = layerName ? `${layerName}${extension}` : doc.nombre;
                            
                            return (
                                <ExternalLink key={index} href={doc.enlace} label={nameWithExt} />
                            );
                        })}
                    </div>
                </InfoSection>
            )}
        </div>
    );
};

export default LayerInfoSections;

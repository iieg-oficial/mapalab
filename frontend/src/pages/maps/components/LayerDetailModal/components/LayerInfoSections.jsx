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
    if (!href?.startsWith('https://')) return null;
    return (
        <a href={href} target="_blank" rel="noopener noreferrer"
            className="text-[12px]/[18px] font-garet font-medium text-[#5C2472] underline">
            {label}
        </a>
    );
};

const LayerInfoSections = ({ metadata, layerName }) => {
    if (!metadata) return null;

    return (
        <div className="flex flex-col gap-4">
            {(metadata.fuentes_texto_largo || metadata.fuentes_enlace) && (
                <InfoSection title="Fuente">
                    {metadata.fuentes_texto_largo && <TextBlock text={metadata.fuentes_texto_largo} />}
                    {metadata.fuentes_enlace && (() => {
                        const links = metadata.fuentes_enlace.split(',').map(l => l.trim()).filter(Boolean);
                        if (links.length <= 1) return <ExternalLink href={metadata.fuentes_enlace} label="Ver fuente" />;
                        return (
                            <div className="flex flex-col gap-1">
                                {links.map((link, i) => (
                                    <ExternalLink key={i} href={link} label={`Fuente ${i + 1}`} />
                                ))}
                            </div>
                        );
                    })()}
                </InfoSection>
            )}
            {(metadata.metodologia_texto || metadata.metodologia_archivo_enlace) && (
                <InfoSection title="Metodología">
                    {metadata.metodologia_texto && <TextBlock text={metadata.metodologia_texto} />}
                    <ExternalLink href={metadata.metodologia_archivo_enlace} label="Ver documento" />
                </InfoSection>
            )}
            {(metadata.texto_leyenda_juridico || metadata.tipo_mapa) && (
                <InfoSection title="Referencia cartográfica">
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

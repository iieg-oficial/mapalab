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

const LayerInfoSections = ({ metadata }) => {
    if (!metadata) return null;

    return (
        <>
            {(metadata.fuentes_texto_largo || metadata.fuentes_enlace) && (
                <InfoSection title="Fuente">
                    {metadata.fuentes_texto_largo && <TextBlock text={metadata.fuentes_texto_largo} />}
                    <ExternalLink href={metadata.fuentes_enlace} label="Ver fuente" />
                </InfoSection>
            )}
            {(metadata.metodologia_texto || metadata.metodologia_archivo_enlace) && (
                <InfoSection title="Metodología">
                    {metadata.metodologia_texto && <TextBlock text={metadata.metodologia_texto} />}
                    <ExternalLink href={metadata.metodologia_archivo_enlace} label="Ver documento" />
                </InfoSection>
            )}
            {metadata.metadato?.length > 0 && (
                <InfoSection title="Metadato">
                    <div className="flex flex-col gap-1">
                        {metadata.metadato.map((doc, index) => (
                            <ExternalLink key={index} href={doc.enlace} label={doc.nombre} />
                        ))}
                    </div>
                </InfoSection>
            )}
        </>
    );
};

export default LayerInfoSections;

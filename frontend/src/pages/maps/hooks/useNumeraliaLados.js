import { useMemo } from 'react';
import { useMapsContext } from '@hooks/useMaps';
import { useLayerMetadata } from '@hooksMaps/useLayerMetadata';
import { conFechas, ladoDe } from '@pages/maps/helpers/numeraliaLados';

export const useNumeraliaLados = (layerId, base) => {
    const { compareMode, getSpecificFilter } = useMapsContext();
    const { lado, ambos } = ladoDe(compareMode, layerId);
    const cqlA = lado ? compareMode?.paneA?.filters?.[layerId]?.date || null : null;
    const cqlB = lado ? compareMode?.paneB?.filters?.[layerId]?.date || null : null;
    const cqlVivo = !lado && layerId ? getSpecificFilter?.(layerId, 'date') || null : null;

    const contextos = useMemo(() => ({
        A: conFechas(base, cqlA),
        B: conFechas(base, cqlB),
        vivo: conFechas(base, cqlVivo),
    }), [base, cqlA, cqlB, cqlVivo]);

    const otro = lado === 'B' ? 'A' : 'B';
    const { metadata: metadataOtro } = useLayerMetadata(ambos ? layerId : null, contextos[otro]);

    return {
        lado,
        otro,
        ambos,
        contexto: lado ? contextos[lado] : contextos.vivo,
        metadataOtro: ambos ? metadataOtro : null,
    };
};

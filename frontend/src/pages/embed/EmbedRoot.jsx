import { useMemo } from 'react';
import { useSearchParams } from 'react-router';
import MapsProvider from '@providers/MapsProvider';
import { LayersProvider } from '@providers/LayersProvider';
import { LayerLoadingProvider } from '@contexts/LayerLoadingContext';
import { EmbedLayersProxy } from '@pages/embed/EmbedLayersProxy';
import EmbedView from '@pages/embed/EmbedView';
import { parseEmbedParams } from '@pages/embed/helpers/embedParams';


const EmbedRoot = () => {
    const [searchParams] = useSearchParams();
    const params = useMemo(() => parseEmbedParams(searchParams), [searchParams]);

    return (
        <LayersProvider>
            <EmbedLayersProxy apiKey={params.key}>
                <LayerLoadingProvider>
                    <MapsProvider>
                        <EmbedView params={params} />
                    </MapsProvider>
                </LayerLoadingProvider>
            </EmbedLayersProxy>
        </LayersProvider>
    );
};

export default EmbedRoot;

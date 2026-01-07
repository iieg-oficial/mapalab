import { useMapsContext } from '@hooks/useMaps';
import { useSiderAnchoredPosition } from '@contexts/SiderContext';
import Loading from '@components/Loading';

const GlobalLoading = () => {
    const { loadingLayers, isLocating } = useMapsContext();
    const { style, className } = useSiderAnchoredPosition({ offset: 28 });

    if (loadingLayers.size === 0 && !isLocating) return null;

    return (
        <div
            className={`fixed top-11 z-20 ${className}`}
            style={style}
        >
            <Loading visible={true} size="size-12" />
        </div>
    );
};

export default GlobalLoading;

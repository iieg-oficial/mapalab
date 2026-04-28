import MapView from './MapView';
import { useMapsContext } from '@hooks/useMaps';
import { useViewSync } from '@pages/maps/hooks/useViewSync';

const CompareView = () => {
    const { compareMode, paneMapRefs } = useMapsContext();
    const panes = Array.isArray(compareMode?.panes) ? compareMode.panes : [];
    useViewSync(paneMapRefs, !!compareMode?.active);
    if (panes.length < 2) return null;

    return (
        <div className="absolute inset-0 flex">
            {panes.slice(0, 2).map((pane, idx) => (
                <div
                    key={idx}
                    className={`relative flex-1 h-full ${idx === 0 ? 'border-r-2 border-white' : ''}`}
                >
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 z-10 px-3 py-1 bg-white/90 border border-gray-300 rounded-full text-xs font-medium text-gray-700 shadow pointer-events-none">
                        {pane.label || pane.value}
                    </div>
                    <MapView
                        paneIndex={idx}
                        dateOverride={pane.value}
                        className="absolute inset-0 w-full h-full"
                    />
                </div>
            ))}
        </div>
    );
};

export default CompareView;

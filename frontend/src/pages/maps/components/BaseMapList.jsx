import { BASEMAP_ORDER } from '@pages/maps/helpers/basemaps';
import { useMapsContext } from '@hooks/useMaps';
import Icon from '@components/Icon';

const BaseMapList = () => {
    const { baseMapId, setBaseMapId, basemaps } = useMapsContext();

    return (
        <div className="space-y-1">
            {BASEMAP_ORDER.map(id => {
                const active = baseMapId === id;
                const label = basemaps[id]?.label ?? id;

                return (
                    <button
                        key={id}
                        onClick={() => setBaseMapId(id)}
                        className={[
                            'group w-full flex items-center gap-2',
                            'rounded-lg px-2 py-2',
                            active
                                ? 'bg-blue-500 text-white'
                                : 'hover:bg-black/5'
                        ].join(' ')}
                        title={label}
                    >
                        <BasemapIcon id={id} active={active} />
                        <span
                            className={['text-sm transition', 'opacity-100'].join(' ')}
                        >
                            {label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
};

const BasemapIcon = ({ id, active }) => (
    <Icon
        name={id ? id : 'default'}
        className={active ? 'stroke-white' : 'stroke-current'}
    />
);

export default BaseMapList;

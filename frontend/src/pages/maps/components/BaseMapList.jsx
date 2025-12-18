import { BASEMAP_ORDER } from '@pages/maps/helpers/basemaps';
import { useMapsContext } from '@hooks/useMaps';
import Icon from '@components/Icon';

const BaseMapList = () => {
    const { baseMapId, setBaseMapId, basemaps } = useMapsContext();

    return (
        <div className="py-6 px-4">
            <label className="block text-[18px]/[47px] font-garet font-bold mb-2 text-[#5C2472] tracking-normal">
                Mapas Base
            </label>
            <div className="grid grid-cols-2 gap-4">
                {BASEMAP_ORDER.map(id => {
                    const active = baseMapId === id;
                    const label = basemaps[id]?.label ?? id;

                    return (
                        <button
                            key={id}
                            onClick={() => setBaseMapId(id)}
                            className={`
                                flex flex-col items-center justify-center gap-2 cursor-pointer
                                w-[138px] h-[142px] p-3 rounded-[9px] bg-white border
                                ${active ? 'border-[#70308A]' : 'border-transparent hover:border-[#465055]/20'}
                            `}
                            title={label}
                        >
                            <div className="w-[55px] h-[55px] flex items-center justify-center">
                                <Icon
                                    name={id ? id : 'default'}
                                    className="w-10 h-10"
                                />
                            </div>
                            <span className={`text-[12px]/[18px] font-garet text-center ${active ? 'font-bold text-[#5C2472]' : 'font-medium text-[#465055]'}`}>
                                {label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default BaseMapList;

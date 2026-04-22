import { useState } from 'react';
import { BASEMAP_ORDER } from '@pages/maps/helpers/basemaps';
import { useMapsContext } from '@hooks/useMaps';
import Icon from '@components/Icon';
import { trackBasemapChange } from '@services/analyticsService';

const BaseMapList = ({ closeButton }) => {
    const { baseMapId, setBaseMapId, basemaps } = useMapsContext();
    const [hoveredId, setHoveredId] = useState(null);

    return (
        <div className="py-6 px-4">
            <div className="flex items-center justify-between">
                <h3 className="block text-[18px]/[47px] font-garet font-bold mb-2 text-[#5C2472] tracking-normal">
                    Mapas Base
                </h3>
                {closeButton}
            </div>
            <div className="grid grid-cols-2 gap-4">
                {BASEMAP_ORDER.map(id => {
                    const active = baseMapId === id;
                    const label = basemaps[id]?.label ?? id;

                    return (
                        <button
                            key={id}
                            onClick={() => { setBaseMapId(id); trackBasemapChange(id); }}
                            onMouseEnter={() => setHoveredId(id)}
                            onMouseLeave={() => setHoveredId(null)}
                            className={`
                                flex flex-col items-center justify-center gap-2 cursor-pointer
                                w-[138px] h-[142px] p-3 rounded-[9px] bg-transparent border
                                ${active ? 'border-[#70308A]' : 'border-transparent hover:border-[#70308A]'}
                            `}
                            title={label}
                        >
                            <div className="flex items-center justify-center">
                                <Icon
                                    name={id}
                                    state={active || hoveredId === id ? 'hover' : 'normal'}
                                    className={`${active || hoveredId === id ? 'size-[57px]' : 'size-[47px]'}`}
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

import { useState } from 'react';
import { useNavigate } from 'react-router';
import Icon from '@components/Icon';

const Card = ({ topics = [] }) => {
    const navigate = useNavigate();
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const handleSubtopicClick = (layerIds) => {
        const layers = Array.isArray(layerIds) ? layerIds.join(',') : layerIds;
        navigate(`/mapa?layers=${layers}`);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-[16px] md:gap-[34px]">
            {topics.map((topic, index) => {
                const isOpen = hoveredIndex === index;

                return (
                    <div
                        key={topic.id}
                        className="relative group hover:z-50 h-[110px] w-full md:max-w-[397px]"
                        onMouseEnter={() => setHoveredIndex(index)}
                        onMouseLeave={() => setHoveredIndex(null)}
                    >
                        <div
                            className={`
                                absolute top-0 left-0 right-0 flex flex-col p-4.5 rounded-[13px] bg-white
                                transition-all duration-500 ease-in-out overflow-hidden
                                ${isOpen ? 'z-50 shadow-[0px_6px_12px_#ACBFE56C]' : ''}
                            `}
                        >
                            <div className="flex items-center gap-7">
                                <div className={`
                                    flex items-center justify-center rounded-full size-[82px] shrink-0
                                    ${isOpen ? 'bg-[#FAF2FD] self-start' : ''}
                                `}>
                                    <Icon name={topic.icon} state="hover" className="size-[50px]" />
                                </div>
                                <div className={`
                                    flex flex-col flex-1 transition-all duration-300
                                    ${isOpen ? 'gap-7 justify-start' : 'justify-center'}
                                `}>
                                    <p className={`
                                        font-garet font-bold text-[21px]/[28px] text-[#5C2472] tracking-normal
                                    `}>
                                        {topic.label}
                                    </p>
                                    <p className={`
                                        font-garet font-medium text-[14px]/[28px] text-[#454545] tracking-normal
                                        max-h-0 overflow-hidden transition-all duration-300
                                        group-hover:max-h-20
                                        ${isOpen ? 'max-h-20' : ''}
                                    `}>
                                        {topic.description}
                                    </p>
                                </div>
                            </div>

                            {topic.subtopics && topic.subtopics.length > 0 && (
                                <ul className={`
                                    flex flex-col gap-2 max-h-0 overflow-hidden transition-all duration-500 ease-in-out
                                    group-hover:max-h-[300px] group-hover:mt-4
                                    ${isOpen ? 'max-h-[300px] mt-4' : ''}
                                `}>
                                    {topic.subtopics.map((subtopic, idx) => (
                                        <li key={idx}>
                                            <button
                                                onClick={() => handleSubtopicClick(subtopic.layerIds)}
                                                className="
                                                    w-full text-left px-3 py-2 rounded-lg
                                                    font-garet font-medium text-[14px] text-[#454545]
                                                    hover:bg-[#F4F1FF] hover:text-[#5C2472]
                                                    transition-all duration-200 cursor-pointer
                                                "
                                            >
                                                {subtopic.label}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default Card;

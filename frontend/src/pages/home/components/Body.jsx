import { useRef, useState } from 'react';
import SearchBar from './SearchBar';
import Card from './Card';
import TitleAndNote from './TitleAndNote';
import topicsConfig from '../config/topicsConfig';
import guideConfig from '../config/guideConfig';
import selectConfig from '../config/selectConfig';
import suportConfig from '../config/suportConfig';

const Body = () => {
    const carouselRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [expandedSection, setExpandedSection] = useState(null);

    const toggleSection = (id) => {
        setExpandedSection(expandedSection === id ? null : id);
    };

    const handleMouseDown = (e) => {
        const carousel = carouselRef.current;
        if (!carousel) return;
        setIsDragging(true);
        setStartX(e.pageX - carousel.offsetLeft);
        setScrollLeft(carousel.scrollLeft);
        carousel.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        e.preventDefault();
        const carousel = carouselRef.current;
        if (!carousel) return;
        const x = e.pageX - carousel.offsetLeft;
        const walk = (x - startX) * 2;
        carousel.scrollLeft = scrollLeft - walk;
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        const carousel = carouselRef.current;
        if (carousel) carousel.style.cursor = 'grab';
    };

    const handleMouseLeave = () => {
        if (isDragging) handleMouseUp();
    };

    return (
        <div className="gap-y-9">
            <div
                className='
                    relative z-10 -mt-[5vh] xl:-mt-[23vh] mx-[3%] xl:mx-[5%] bg-[#F9FBFF] rounded-[30px] 
                    p-3 md:p-5 lg:p-10 flex flex-col shadow-[0px_3px_21px_#ACBFE56C] gap-y-3
                '
            >
                <SearchBar className="relative mx-auto" />
                <span className='block font-garet font-normal text-[#5C2472] text-[19px] md:text-[19px]/[64px] tracking-normal text-center'>
                    Puedes buscar por palabra clave o seleccionar una de las temáticas disponibles para navegar en el mapa
                </span>
                <Card topics={topicsConfig.topics} />
            </div>
            <div className="my-9 mx-4 flex flex-col justify-center items-center">
                <TitleAndNote title={guideConfig.title} description={guideConfig.note} />
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-10 lg:gap-x-16 2xl:gap-x-36 2xl:gap-y-14 md:mx-10 mt-8">
                    {guideConfig.steps.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-col gap-3 items-center justify-end rounded-[13px] py-6 px-10 bg-white md:w-[400px] h-[360px] shadow-[0px_6px_12px_#ACBFE533]"
                        >
                            <img
                                src={item.image}
                                className="bg-[transparent linear-gradient(0deg, #F3EBFF 0%, #F4EBFF00 100%) 0% 0% no-repeat padding-box] size-[122px] rounded-[16px]"
                                alt={item.header}
                            />
                            <div className="flex flex-col justify-start items-center text-center">
                                <h2 className="blockfont-garet font-bold text-[#FF8300] text-[16px]/[64px] tracking-normal">
                                    {item.header}
                                </h2>
                                <p className="font-garet font-book text-[#2E4372] text-[14px]/[24px] tracking-normal min-h-[93px]">
                                    {item.label}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="pt-5 relative">
                <TitleAndNote title={selectConfig.title} description={selectConfig.description} />
                <div
                    ref={carouselRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseLeave}
                    className="
                        flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth ml-[3%] xl:ml-[5%]
                        mt-8 px-4 md:px-10 scrollbar-thin scrollbar-hidden cursor-grab select-none
                    "
                >
                    {selectConfig.options.map((item) => (
                        <div
                            key={item.id}
                            className="relative flex-shrink-0 snap-start rounded-[40px] overflow-hidden h-[560px] w-[calc(95%-24px)] max-w-[1422px]"
                            style={{ backgroundColor: item.color }}
                        >
                            <div
                                className="absolute inset-0 xl:hidden"
                                style={{
                                    background: `linear-gradient(180deg, ${item.color}E6 0%, ${item.color}E6 100%), url(${item.image})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat'
                                }}
                            />
                            <div
                                className="
                                    relative z-10 flex flex-col xl:flex-row justify-center xl:justify-start 
                                    items-center xl:items-start h-full px-4 md:px-10 xl:px-0 xl:pt-[85px]
                                "
                            >
                                <img
                                    src={item.image}
                                    alt={item.header}
                                    className="hidden xl:block xl:max-w-[506px] xl:max-h-[389px] object-cover xl:ml-[33px]"
                                />
                                <div className="w-full flex flex-col justify-center xl:justify-start mx-4 2xl:mr-[188px]">
                                    <h3
                                        className="
                                            font-garet font-bold text-[#5C2472] text-[24px] md:text-[36px]/[50px] tracking-normal 
                                            text-center lg:text-left w-full max-w-[550px] mb-10
                                        "
                                    >
                                        {item.header}
                                    </h3>
                                    <p
                                        className="
                                            font-garet font-book text-[#5C2472] text-[16px] md:text-[18px]/[36px] tracking-normal 
                                            text-center lg:text-justify xl:text-left w-full xl:max-w-[653px] whitespace-pre-line
                                        "
                                    >
                                        {item.label}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="my-[61px] mx-[3%] xl:mx-[5%]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[1100px] mx-auto">
                    {suportConfig.sections.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => toggleSection(item.id)}
                            className={`
                                group relative bg-[#F3EBFF] flex items-center rounded-[50px]
                                w-full h-[110px] transition-all
                                ${expandedSection === item.id ? 'border border-[#5C2472]' : 'hover:border hover:border-[#5C2472]'}
                            `}
                        >
                            <div className="absolute left-[43px] flex items-center justify-center bg-white group-hover:bg-[#E5D9F2] rounded-full p-3 size-[74px]">
                                <img
                                    src={item.icon}
                                    alt=""
                                    className={`size-full ${expandedSection === item.id ? 'hidden' : 'block group-hover:hidden'}`}
                                />
                                <img
                                    src={item.iconHover}
                                    alt=""
                                    className={`size-full ${expandedSection === item.id ? 'block' : 'hidden group-hover:block'}`}
                                />
                            </div>
                            <h2 className="font-garet font-medium text-[#8936AB] text-[24px]/[28px] tracking-normal ml-[140px]">
                                {item.label}
                            </h2>
                        </button>
                    ))}
                </div>
                {suportConfig.sections.map((item) => (
                    <div
                        key={item.id}
                        className={`
                            overflow-hidden transition-all duration-300 ease-in-out max-w-[1100px] mx-auto shadow-[0px_6px_12px_#ACBFE533]
                            rounded-[13px]
                            ${expandedSection === item.id ? 'max-h-[500px] opacity-100 mt-6' : 'max-h-0 opacity-0'}
                        `}
                    >
                        <div className="bg-white rounded-[20px] p-6">
                            {item.content.map((contentItem, index) => (
                                <div key={index} className="py-3 border-b border-[#E5D9F2] last:border-b-0">
                                    <h3 className="font-garet font-medium text-[#5C2472] text-[18px]">
                                        {contentItem.question || contentItem.title}
                                    </h3>
                                    <p className="font-garet font-book text-[#2E4372] text-[14px] mt-1">
                                        {contentItem.answer || contentItem.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Body;

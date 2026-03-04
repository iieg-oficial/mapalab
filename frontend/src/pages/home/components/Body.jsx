import { useRef, useState } from 'react';
import SearchBar from './SearchBar';
import Card from './Card';
import TitleAndNote from './TitleAndNote';
import Icon from '@components/Icon';
import topicsConfig from '../config/topicsConfig';
import guideConfig from '../config/guideConfig';
import selectConfig from '../config/selectConfig';
import suportConfig from '../config/suportConfig';

const Body = ({ isModal = false }) => {
    const carouselRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);
    const [expandedSection, setExpandedSection] = useState(null);
    const [expandedFaq, setExpandedFaq] = useState({});
    const [activeBtn, setActiveBtn] = useState(0); 

    const toggleSection = (id) => {
        setExpandedSection(expandedSection === id ? null : id);
        setActiveBtn(!activeBtn);
    };

    const toggleFaq = (sectionId, index) => {
        const key = `${sectionId}-${index}`;
        setExpandedFaq(prev => ({ ...prev, [key]: !prev[key] }));
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
            {!isModal && (
                <div
                    className='
                        relative z-10 -mt-[5vh] 2xl:-mt-[23vh] mx-[3%] 2xl:mx-[5%] bg-[#F9FBFF] rounded-[30px]
                        p-3 md:p-5 lg:p-10 flex flex-col shadow-[0px_3px_21px_#ACBFE56C] gap-y-3
                    '
                >
                    <span className='block font-garet font-normal text-numeralia text-[18px] mt-4 lg:mt-0 mb-4 2xl:leading-16 tracking-normal text-center'>
                        Puedes buscar por palabra clave o seleccionar una de las temáticas disponibles para navegar en el mapa
                    </span>
                    <SearchBar className="relative mx-auto mb-2" />
                    
                    <Card topics={topicsConfig.topics} />
                </div>
            )}
            <div className="my-9 mx-4 flex flex-col justify-center items-center">
                <TitleAndNote title={guideConfig.title} description={guideConfig.note} />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10 lg:gap-x-16 2xl:gap-x-36 2xl:gap-y-14 md:mx-10 mt-8">
                    {guideConfig.steps.map((item) => (
                        <div
                            key={item.id}
                            className="flex flex-col gap-3 items-center justify-end rounded-[13px] py-6 px-10 bg-white w-full max-w-[400px] h-[360px] shadow-[0px_6px_12px_#ACBFE533]"
                        >
                            <img
                                src={item.image}
                                className="bg-[transparent linear-gradient(0deg, #F3EBFF 0%, #F4EBFF00 100%) 0% 0% no-repeat padding-box] size-[122px] rounded-[16px]"
                                alt=""
                                loading="lazy"
                            />
                            <div className="flex flex-col justify-start items-center text-center">
                                <h3 className="blockfont-garet font-bold text-orange text-[16px] xl:leading-16 tracking-normal mb-5 mt-3 xl:mb-0 xl:mt-0">
                                    {item.header}
                                </h3>
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
                            className="relative flex-shrink-0 snap-start rounded-[40px] overflow-hidden h-auto pb-10 xl:h-[575px] w-full md:w-[calc(95%-24px)] max-w-[1422px]"
                            style={{ backgroundColor: item.color }}
                        >
                            
                            <div
                                className="
                                    relative z-10 grid grid-cols-1 xl:flex xl:flex-row justify-center xl:justify-start 
                                    items-center px-4 md:px-10 xl:px-0 xl:pt-[85px] min-h-[305px] h-auto
                                "
                            >
                                <img
                                    src={item.image}
                                    alt=""
                                    className="mx-auto my-5 w-1/2 block lg:w-2/5 xl:max-w-[506px] xl:max-h-[389px] object-cover xl:ml-[33px]"
                                    loading="lazy"
                                />
                                <div className="w-full flex flex-col justify-center xl:justify-start 2xl:mr-[188px]">
                                    <h3
                                        className="
                                            font-garet font-bold text-purple text-[24px] md:text-[36px]/[50px] tracking-normal 
                                            text-center lg:text-left w-full max-w-[550px] mb-10
                                        "
                                    >
                                        {item.header}
                                    </h3>
                                    <p
                                        className="
                                            font-garet font-book text-purple text-[16px] md:text-[18px]/[36px] tracking-normal 
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
            <div className="w-full flex items-center justify-center my-10 md:my-[61px]">
                {suportConfig.sections.map((item) => (
                    <button
                        key={item.id}
                        onClick={() => toggleSection(item.id)}
                        id="qaf-button"
                        className={`
                            ${activeBtn ? 'bg-purple active' : ''} group relative bg-[#F3EBFF] flex flex-col sm:flex-row items-center justify-center md:justify-end rounded-[50px]
                            w-full max-w-[522px] h-[150px] sm:h-[110px] transition-all border border-transparent md:pl-0 pl-0 md:pr-22 py-5 md:py-0 mx-4
s                            ${expandedSection === item.id ? 'border-purple' : 'hover:border-purple'} cursor-pointer 
                        `}
                    >
                        <div className="sm:absolute left-4 md:left-[43px] flex items-center justify-center bg-white rounded-full p-4 size-[74px] qaf">
                            <img
                                src={item.icon}
                                alt=""
                                className={`size-full ${expandedSection === item.id ? 'hidden' : 'block group-hover:hidden'}`}
                                loading="lazy"
                            />
                            <img
                                src={item.iconHover}
                                alt=""
                                className={`size-full ${expandedSection === item.id ? 'block' : 'hidden group-hover:block'}`}
                                loading="lazy"
                            />
                        </div>
                        <h2 className={`font-garet font-medium ${activeBtn ? 'text-white' : 'text-[#8936AB]'} text-[24px]/[28px] tracking-normal pt-4 sm:pt-0`}>
                            {item.label}
                        </h2>
                    </button>
                ))}
            </div>

            <div className={`w-full flex flex-col items-center justify-center px-2 bg-[#F9FBFF] ${expandedSection === 1 ? 'block' : 'hidden'}`}>
                {suportConfig.sections.map((item) => (
                    <div key={item.id} className="w-full max-w-[1330px] bg-transparent mb-4 lg:mb-20">
                        {item.content.map((contentItem, index) => {
                            const isExpanded = expandedFaq[`${item.id}-${index}`];
                            return (
                                <div
                                    key={index}
                                    onClick={() => toggleFaq(item.id, index)}
                                    className="bg-white rounded-[13px] mb-4 py-8 px-4 lg:pr-9 lg:pl-[106px] cursor-pointer"
                                >
                                    <div className="flex items-center justify-between">
                                        <h3 className="font-garet font-medium text-[#2E4372] text-[19px]/[28px] tracking-normal">
                                            {contentItem.question || contentItem.title}
                                        </h3>
                                        <Icon
                                            name="downArrow"
                                            tooltip={isExpanded ? 'Cerrar' : 'Abrir'}
                                            classNameBG="bg-[#F9FBFF] size-7.5 rounded-full flex items-center justify-center p-2"
                                            className={`w-5 h-2 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                    </div>
                                    <div className={`w-full max-w-6xl mt-5 ${isExpanded ? 'block' : 'hidden'}`}>
                                        <p className="font-garet font-regular text-[#2E4372] text-[18px]/[26px] tracking-normal text-left">
                                            {contentItem.answer || contentItem.description}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>


        </div>
    );
};

export default Body;

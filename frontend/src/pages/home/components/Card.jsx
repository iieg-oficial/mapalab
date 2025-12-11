import CardResponsive from './CardResponsive';

const Card = ({ options = [] }) => {
    const expandLeft = (index, isMobile) => {
        if (isMobile) return false;
        const screenWidth = window.innerWidth;
        let cols;
        if (screenWidth >= 1024) cols = 4;
        else if (screenWidth >= 768) cols = 3;
        else cols = 2;
        const position = (index % cols) + 1;
        return position > cols / 2;
    };

    return (
        <>
            <div className="block md:hidden mt-10 px-4">
                <CardResponsive options={options} />
            </div>

            <div className="hidden md:grid relative grid-cols-3 lg:grid-cols-4 gap-6 mt-10 px-4 md:px-10 min-h-[200px]">
                {options.map((item, index) => {
                    const expandToLeft = expandLeft(index, false);

                    return (
                        <div key={item.id} className="relative group hover:z-[100]">
                            <div className="w-full h-[110px] sm:h-[120px] group-hover:invisible"></div>

                            <div
                                className={`
                                    absolute top-0 flex flex-col p-4 sm:p-6 rounded-2xl bg-white shadow-md
                                    transform transition-all duration-500 ease-in-out
                                    w-full max-h-[110px] sm:max-h-[120px]
                                    group-hover:max-h-[340px]
                                    group-hover:w-[calc(200%+1rem)]
                                    hover:shadow-xl hover:scale-[1.02]
                                    ${expandToLeft ? 'origin-bottom-right right-0' : 'origin-bottom-left left-0'}
                                    overflow-hidden
                                    z-10
                                `}
                                style={{ backgroundColor: item.bgColor || 'white' }}
                            >
                                <div className="flex items-center gap-4">
                                    <div 
                                        className="
                                            flex items-center justify-center bg-[#f2f2f2] rounded-full text-gray-600 font-bold text-sm
                                            min-w-12 min-h-12 w-12 h-12 aspect-square shrink-0
                                        "
                                    >
                                        {item.icon || ''}
                                    </div>
                                    <p className="text-base sm:text-sm md:text-lg font-semibold text-gray-800 leading-tight">
                                        {item.label}
                                    </p>
                                </div>

                                {item.submenu && item.submenu.length > 0 && (
                                    <ul
                                        className={`
                                            grid grid-cols-1 md:grid-cols-3 gap-3 mt-5
                                            transition-all duration-500 ease-in-out
                                            opacity-0 scale-95 translate-y-3
                                            group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0
                                        `}
                                    >
                                        {item.submenu.map((option, idx) => (
                                            <li
                                                key={idx}
                                                className={`
                                                    text-sm sm:text-base font-medium text-gray-700 hover:text-gray-900
                                                    transition-all duration-500 ease-in-out
                                                    opacity-0 group-hover:opacity-100
                                                    translate-y-2 group-hover:translate-y-0
                                                `}
                                            >
                                                <a className="cursor-pointer block w-full" href={option.submenuPath}>
                                                    {option.submenuLabel}
                                                </a>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
};

export default Card;

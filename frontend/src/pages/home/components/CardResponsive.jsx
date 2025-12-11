import { useState } from 'react';

const CardResponsive = ({ options = [] }) => {
    const [openIndex, setOpenIndex] = useState(null);

    const handleClick = (index) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="flex flex-col gap-4 mt-10 px-4">
            {options.map((item, index) => {
                const isOpen = openIndex === index;

                return (
                    <div
                        key={item.id}
                        onClick={() => handleClick(index)}
                        className={`flex flex-col p-5 rounded-2xl bg-white shadow-md transform transition-all duration-500 ease-in-out overflow-hidden cursor-pointer
              ${isOpen ? 'max-h-[400px] shadow-xl scale-[1.02]' : 'max-h-[110px]'}
              md:max-h-none md:scale-100 md:shadow-md md:cursor-default
            `}
                        style={{ backgroundColor: item.bgColor || 'white' }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#f2f2f2] rounded-full flex items-center justify-center text-gray-600 font-bold text-lg">
                                {item.icon || ''}
                            </div>
                            <p className="text-base font-semibold text-gray-800 leading-tight">
                                {item.label}
                            </p>
                        </div>

                        {item.submenu && item.submenu.length > 0 && (
                            <ul
                                className={`grid gap-3 mt-3 transition-all duration-500 ease-in-out
                  ${isOpen ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'}
                  md:opacity-100 md:scale-100 md:translate-y-0 md:pointer-events-auto
                `}
                            >
                                {item.submenu.map((option, idx) => (
                                    <li
                                        key={idx}
                                        className="px-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                                    >
                                        <a className="block w-full" href={option.submenuPath}>
                                            {option.submenuLabel}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default CardResponsive;

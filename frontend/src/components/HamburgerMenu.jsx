import { useState } from 'react';

const HamburgerMenu = ({ options = [] }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex flex-col justify-between w-8 h-6 focus:outline-none"
                aria-label="Toggle menu"
            >
                <span
                    className={`block h-1 bg-black rounded transition-all duration-300 ${
                        isOpen ? 'rotate-45 translate-y-2' : ''
                    }`}
                ></span>
                <span
                    className={`block h-1 bg-black rounded transition-all duration-300 ${
                        isOpen ? 'opacity-0' : ''
                    }`}
                ></span>
                <span
                    className={`block h-1 bg-black rounded transition-all duration-300 ${
                        isOpen ? '-rotate-45 -translate-y-2' : ''
                    }`}
                ></span>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-8 w-48 bg-[#e2e2e2] min-w-screen rounded-lg shadow-lg z-50">
                    <ul className="flex flex-col p-2 gap-2">
                        {options.map((item) => (
                            <li key={item.id}>
                                <a
                                    href={item.path}
                                    className="block px-4 py-2 text-gray-700 text-center font-semibold"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {item.label}
                                </a>
                            </li>
                        ))}
                    </ul>
                    <div className="flex items-center justify-center gap-5 mb-5">
                        <div className="rounded-full bg-white h-18 w-18 hover:cursor-pointer hover:bg-gray-400"></div>
                        <div className="rounded-full bg-white h-18 w-18 hover:cursor-pointer hover:bg-gray-400"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HamburgerMenu;

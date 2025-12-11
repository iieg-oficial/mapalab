import { Link } from 'react-router';

const SelectSection = () => {
    const selectionOtions = [
        {
            id: 1,
            image: '',
            header: 'Limites Municipales IIEG',
            label: 'lorem ipsum dolor sit amet, consectetur adipiscing elit',
            path: '/mapa'
        },
        {
            id: 2,
            image: '',
            header: 'Limites Municipales IIEG',
            label: 'lorem ipsum dolor sit amet, consectetur adipiscing elit',
            path: '/mapa'
        },
        {
            id: 3,
            image: '',
            header: 'Satelital',
            label: '',
        },
        {
            id: 4,
            image: '',
            header: 'Color',
            label: '',
        },
    ];

    const [item1, item2, item3, item4] = selectionOtions;

    return (
        <div className="pt-5 pb-10 px-4 md:px-10">
            <div className="flex flex-col gap-4 md:gap-6 text-center">
                <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-[#454545] leading-tight">
          Selecciona un mapa base para visualizar la informacion
                </h2>
                <p className="text-black text-sm sm:text-base md:text-lg max-w-[600px] mx-auto">
          orem ipsum, dolor sit amet consectetur adipisicing elit. Exercitationem, iste officia! Dolorem eligendi corporis rerum, ipsum quam doloribus aliquid harum?
                </p>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-5 mt-8">
                {[item1, item2].map((item) => (
                    <Link
                        key={item.id}
                        to={item.path}
                        className="bg-[#f5f5f5] flex gap-4 sm:gap-5 items-center p-6 sm:p-8 md:p-10 rounded-xl min-w-[250px] md:min-w-[300px]"
                    >
                        <img
                            src={item.image}
                            alt={item.header}
                            className="bg-[#e2e2e2] w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 rounded-full object-cover"
                        />
                        <div className="flex flex-col justify-center gap-1 sm:gap-2">
                            <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-extrabold text-[#454545]">{item.header}</h2>
                            <p className="text-xs sm:text-sm md:text-base text-black">{item.label}</p>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="flex flex-wrap justify-center items-center gap-5 mt-8">
                {[item3, item4].map((item) => (
                    <div
                        key={item.id}
                        className="bg-[#f5f5f5] flex gap-4 sm:gap-5 items-center p-6 sm:p-8 md:p-10 rounded-xl min-w-[250px] md:min-w-[300px]"
                    >
                        <img
                            src={item.image}
                            alt={item.header}
                            className="bg-[#e2e2e2] w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 rounded-full object-cover"
                        />
                        <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-extrabold text-[#454545]">{item.header}</h2>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SelectSection;

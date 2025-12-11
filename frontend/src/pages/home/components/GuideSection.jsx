import PrimaryButton from './PrimaryButton';

const GuideSection = () => {
    const guideSteps = [
        {
            id: 1,
            image: '',
            header: 'Selecciona una tematica',
            label: 'Selecciona un tema y subtema del menu de la izquierda'
        },
        {
            id: 2,
            image: '',
            header: 'Selecciona una ubicacion territorial',
            label: 'Haz zoom o da clic para tener una vista Estatal o municipal'
        },
        {
            id: 3,
            image: '',
            header: 'Activa las capas',
            label: 'Cada tema cuenta con capas que puedes activar o desactivar'
        },
        {
            id: 4,
            image: '',
            header: 'Selecciona una fecha',
            label: 'Puedes visualizar informacion por fechas o rango de fechas'
        },
        {
            id: 5,
            image: '',
            header: 'Descarga la visualizacion',
            label: 'Puedes descargar la vista general del mapa o la vista de cada capa'
        },
    ]; 

    return (
        <div className="m-5 pb-5 flex flex-col justify-center items-center">
            <h2 className="text-lg md:text-2xl font-extrabold text-[#454545] leading-tight text-center">
        ¿Como Navegar en MapaLab?
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-6 mx-4 md:mx-10 my-10">
                {guideSteps.map((item) => (
                    <div
                        key={item.id}
                        className="flex flex-col gap-3 items-center text-center p-4 bg-white h-full"
                    >
                        <img
                            src={item.image}
                            className="bg-[#f5f5f5] w-24 h-24 sm:w-28 sm:h-28 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-full mb-4 object-cover"
                            alt={item.header}
                        />

                        <div className="flex flex-col flex-grow gap-2 justify-start items-center text-center">
                            <h2 className="text-sm sm:text-base md:text-md font-extrabold text-[#454545] leading-tight min-h-[48px] flex items-center justify-center">
                                {item.header}
                            </h2>
                            <p className="text-xs sm:text-sm md:text-sm text-black min-h-[40px]">
                                {item.label}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            <PrimaryButton buttonLabel='Quiero explorar el mapa' buttonSendTo='/mapa'/>
        </div>
    )
}

export default GuideSection;

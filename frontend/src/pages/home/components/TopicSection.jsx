import { useState } from 'react';
import Card from './Card';
import searchIco from '../../../assets/png/search.png';

const TopicSection = () => {
    const [searchTerm, setSearchTerm] = useState('');

    const topicOptions = [
        { 
            id: 1, 
            label: 'General', 
            submenu: [
                { submenuLabel: 'Demografia', submenuPath:'/demografia' }, 
                { submenuLabel: 'Geografia', submenuPath: '/geografia' }, 
                { submenuLabel: 'Patrimonio e Historia', submenuPath: '/patrimonio-e-historia' }
            ] 
        },
        { 
            id: 2, 
            label: 'Economia', 
            submenu: [
                { submenuLabel: 'Demografia', submenuPath:'/demografia' }, 
                { submenuLabel: 'Geografia', submenuPath: '/geografia' }, 
                { submenuLabel: 'Patrimonio e Historia', submenuPath: '/patrimonio-e-historia' }
            ] 
        },
        { 
            id: 3, 
            label: 'Recursos y calidad de vida', 
            submenu: [
                { submenuLabel: 'Demografia', submenuPath:'/demografia' }, 
                { submenuLabel: 'Geografia', submenuPath: '/geografia' }, 
                { submenuLabel: 'Patrimonio e Historia', submenuPath: '/patrimonio-e-historia' }
            ] 
        },
        { 
            id: 4, 
            label: 'Seguridad', 
            submenu: [
                { submenuLabel: 'Demografia', submenuPath:'/demografia' }, 
                { submenuLabel: 'Geografia', submenuPath: '/geografia' }, 
                { submenuLabel: 'Patrimonio e Historia', submenuPath: '/patrimonio-e-historia' }
            ] 
        },
        { 
            id: 5, 
            label: 'Salud', 
            submenu: [
                { submenuLabel: 'Demografia', submenuPath:'/demografia' }, 
                { submenuLabel: 'Geografia', submenuPath: '/geografia' }, 
                { submenuLabel: 'Patrimonio e Historia', submenuPath: '/patrimonio-e-historia' }
            ] 
        },
        { 
            id: 6, 
            label: 'Educacion', 
            submenu: [
                { submenuLabel: 'Demografia', submenuPath:'/demografia' }, 
                { submenuLabel: 'Geografia', submenuPath: '/geografia' }, 
                { submenuLabel: 'Patrimonio e Historia', submenuPath: '/patrimonio-e-historia' }
            ] 
        },
        { 
            id: 7, 
            label: 'Desarollo Social', 
            submenu: [
                { submenuLabel: 'Demografia', submenuPath:'/demografia' }, 
                { submenuLabel: 'Geografia', submenuPath: '/geografia' }, 
                { submenuLabel: 'Patrimonio e Historia', submenuPath: '/patrimonio-e-historia' }
            ] 
        },
        { 
            id: 8, 
            label: 'Gobierno y ciudadania', 
            submenu: [
                { submenuLabel: 'Demografia', submenuPath:'/demografia' }, 
                { submenuLabel: 'Geografia', submenuPath: '/geografia' }, 
                { submenuLabel: 'Patrimonio e Historia', submenuPath: '/patrimonio-e-historia' }
            ] 
        },
    ];

    const filteredOptions = topicOptions.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.submenu.some(sub => sub.submenuLabel.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="relative flex flex-col items-center justify-center bg-[#ebebeb] p-10 -m-5 mx-10 mb-10 rounded-lg z-50">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-[#454545] leading-tight text-center">
        Selecciona una de las tematicas o busca por palabra clave
            </h1>

            <div className='mt-10 relative w-full max-w-md'>
                <input
                    type="text"
                    placeholder='¿Qué quieres buscar?'
                    className='w-full py-2 pl-4 pr-10 text-black text-center rounded-full bg-white transition-all outline-none shadow-sm'
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <img src={searchIco} alt="Buscar" className='w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none'/>
            </div>

            <div className="w-full mt-3 transition-all duration-500 ease-in-out">
                {filteredOptions.length > 0 ? (
                    <Card options={filteredOptions} />
                ) : (
                    <p className="text-gray-500 text-center text-lg mt-10">No se encontró ningún resultado</p>
                )}
            </div>
        </div>
    );
};

export default TopicSection;

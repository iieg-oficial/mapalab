/* eslint-disable react-refresh/only-export-components */
import HamburgerMenu from './HamburgerMenu';

export const headerOptions = [
    {
        id: 'inicio',
        label: 'Inicio',
        path: '/inicio',
    },
    {
        id: 'conocenos',
        label: 'Conocenos',
        path: '/conocenos',
    },
    {
        id: 'sistemasDeInformacion',
        label: 'Sistemas de Informacion',
        path: '/sistemas-de-informacion',
    },
    {
        id: 'datosAbiertosYDocumentacion',
        label: 'Datos Abiertos y documentacion',
        path: '/datos-abiertos-y-documentacion',
    },
    {
        id: 'comunidad',
        label: 'Comunidad',
        path: '/Comunidad',
    },
    {
        id: 'transparencia',
        label: 'Transparencia',
        path: '/transparencia',
    },
    {
        id: 'tramitesyservicios',
        label: 'Tramites y Servicios',
        path: '/tramites-y-servicios',
    }
];

const Navigation = () => {
    return (
        <>
            <nav className="hidden xl:flex gap-7 items-center">
                {headerOptions.map((item) => (
                    <a
                        key={item.id}
                        href={item.path}
                        className="text-[#454545] text-[15px] text-center font-semibold hover:text-black transition-colors duration-200"
                    >
                        {item.label}
                    </a>
                ))}
            </nav>
            <div className="xl:hidden">
                <HamburgerMenu options={headerOptions} />
            </div>
        </>
    );
};

export default Navigation;

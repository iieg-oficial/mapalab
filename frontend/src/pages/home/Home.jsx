import Header from './components/Header'
import Body from './components/Body'
import Footer from './components/Footer'
import bgHome from '@assets/background/bg_home.svg'
import SEO from '@components/SEO'
import useThemeColor from '@hooks/useThemeColor'

const Home = () => {
    useThemeColor('#5C2472');

    return (
        <>
            <SEO
                title="Mapalab"
                description="Mapa interactivo de Jalisco del IIEG. Visualiza mapas oficiales del estado de Jalisco con capas geoespaciales de temperatura, precipitación, recursos naturales, eventos y datos estadísticos."
                keywords="mapa Jalisco, mapas Jalisco, mapa interactivo Jalisco, mapa de Jalisco, geoespacial Jalisco, IIEG, mapas oficiales Jalisco, datos geográficos Jalisco, información territorial Jalisco"
            />
            <h1 className="sr-only">Mapa interactivo de Jalisco — MapaLab IIEG</h1>
            <p className="sr-only">
                MapaLab es la plataforma oficial del Instituto de Información Estadística y Geográfica de Jalisco (IIEG) para consultar mapas de Jalisco con capas geoespaciales temáticas: temperatura, precipitación, recursos naturales, eventos, infraestructura y datos estadísticos del estado. Acceso público a los mapas oficiales de Jalisco.
            </p>
            <div
                className='min-h-screen bg-white overflow-x-hidden'
                style={{
                    backgroundImage: `url(${bgHome})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat'
                }}
            >
                <Header />
                <Body />
                <Footer />
            </div>
        </>
    );
};

export default Home;

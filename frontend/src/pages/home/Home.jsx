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
                description="Explora información geoespacial del estado de Jalisco con mapas interactivos, capas temáticas y datos estadísticos del IIEG."
            />
            <div
                className='min-h-screen bg-white'
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

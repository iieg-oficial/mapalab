import Header from './components/Header'
import Body from './components/Body'
import Footer from './components/Footer'
import bgHome from '@assets/background/bg_home.svg'

const Home = () => {
    return (
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
    );
};

export default Home;

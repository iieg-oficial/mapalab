import TopicSection from './TopicSection';
import GuideSection from './GuideSection';
import SelectSection from './SelectSection';
import SuportSection from './SuportSection';

const Body = () => {
    return (
        <div className="relative z-10 -mt-[26vh] mx-[5%] bg-white rounded-t-3xl shadow-2xl">
            <TopicSection />
            <GuideSection />
            <SelectSection />
            <SuportSection />
        </div>
    );
};

export default Body;

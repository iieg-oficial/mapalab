import Navigation from '../../../components/Navigation';

const Header = () => {
    return (
        <header className="sticky top-0 bg-[#e2e2e2] text-black shadow-md z-100">
            <div className="max-w-[1600px] min-w-[320px] mx-auto flex gap-5 items-center justify-between p-6">
                <div className="bg-white rounded-xl w-50 text-center shadow-sm px-4 py-2 mr-20 ml-5">
                    <h1 className="text-[26px] font-bold font-garetbold text-[#454545]">
                        IIEG
                    </h1>
                </div>

                <Navigation />

                <div className="hidden xl:flex items-center gap-4">
                    <button className="h-15 w-15 rounded-full bg-white shadow hover:bg-gray-200 transition-colors" />
                    <button className="h-15 w-15 rounded-full bg-white shadow hover:bg-gray-200 transition-colors" />
                </div>
            </div>
        </header>
    );
};

export default Header;

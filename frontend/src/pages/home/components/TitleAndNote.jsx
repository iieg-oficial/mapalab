const TitleAndNote = ({ title, description }) => {
    return (
        <div className="flex flex-col items-center w-full text-center">
            <h2 
                className="
                    font-garet font-bold text-[#5C2472] text-[34px] md:text-[34px]/[64px] 
                    mb-4 md:mb-0 tracking-normal max-w-[1111px]
                "
            >
                {title}
            </h2>
            <p 
                className="
                    font-garet font-book text-[#2E4372] text-[19px] md:text-[19px]/[39px] 
                    tracking-normal max-w-[1111px]
                "
            >
                {description}
            </p>
        </div>
    );
};

export default TitleAndNote;

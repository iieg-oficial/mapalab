import { Link } from 'react-router';

const PrimaryButton = ({ 
    buttonLabel = '', 
    buttonSendTo = '', 
    buttonColor = 'bg-[#454545]', 
    hoverColor = 'hover:bg-[#333]' 
}) => {
    return(
        <Link
            to={buttonSendTo}
            className={`${buttonColor} ${hoverColor} font-semibold text-white text-lg md:text-xl px-15 py-2 rounded-full w-full md:w-auto hover:cursor-pointer`}
        >
            {buttonLabel}
        </Link>
    );
};

export default PrimaryButton;

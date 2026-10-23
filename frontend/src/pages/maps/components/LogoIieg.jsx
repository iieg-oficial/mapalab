import Logo from '@components/Logo';

const LogoIieg = ({ isExpanded, visible, onClick }) => (
    <Logo
        name="iieg"
        size={isExpanded ? 'w-41 h-13' : 'w-12 h-13'}
        expanded={isExpanded}
        visible={visible}
        onClick={onClick}
        tooltip="Acerca de Mapa Lab"
        tooltipPlacement="top"
        className="shrink-0 p-3 my-2 w-full"
    />
);

export default LogoIieg;

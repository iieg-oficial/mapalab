import Tooltip from '@components/Tooltip';

const MODES = [
    { key: 'auto', tooltip: 'Automático', color: '#465055' },
    { key: 'expanded', tooltip: 'Expandido fijo', color: '#7C6DC8' },
    { key: 'collapsed', tooltip: 'Colapsado iconos (no recomendado)', color: '#FF8300' },
    { key: 'zen', tooltip: 'Modo zen', color: '#1A2664' },
];

const LockIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
);

const LockOpenIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 9.9-1" />
    </svg>
);

const EyeOffIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
        <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
);

const ModeIcon = ({ mode }) => {
    switch (mode) {
    case 'auto':
        return <span className="text-[10px] font-bold font-garet leading-none">A</span>;
    case 'expanded':
        return <LockIcon />;
    case 'collapsed':
        return <LockOpenIcon />;
    case 'zen':
        return <EyeOffIcon />;
    default:
        return null;
    }
};

const SiderModeButton = ({ lockMode, onToggle }) => {
    const current = MODES.find(m => m.key === lockMode) || MODES[0];
    const isActive = lockMode !== 'auto';

    return (
        <Tooltip content={`${current.tooltip} (Alt+B)`} placement="right">
            <button
                onClick={onToggle}
                className={[
                    'w-6 h-6 rounded-full flex items-center justify-center cursor-pointer',
                    'shadow-[0_2px_8px_#1A26641A] transition-all duration-200',
                    isActive ? 'bg-white hover:bg-gray-50' : 'bg-white hover:bg-gray-50',
                ].join(' ')}
                style={{ color: current.color }}
            >
                <ModeIcon mode={lockMode} />
            </button>
        </Tooltip>
    );
};

export default SiderModeButton;

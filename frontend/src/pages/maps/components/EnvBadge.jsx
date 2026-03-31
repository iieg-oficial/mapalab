const ENV_CONFIG = {
    dev: { label: 'dev', bg: 'bg-purple-500', text: 'text-white' },
    beta: { label: 'test', bg: 'bg-orange-400', text: 'text-white' },
};

const EnvBadge = () => {
    const env = import.meta.env.VITE_APP_ENV;
    const config = ENV_CONFIG[env];

    if (!config) return null;

    return (
        <span
            className={[
                config.bg, config.text,
                'absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10',
                'px-1.5 py-0.5 rounded-full text-[10px] font-bold uppercase leading-none',
                'shadow-sm pointer-events-none select-none',
            ].join(' ')}
        >
            {config.label}
        </span>
    );
};

export default EnvBadge;

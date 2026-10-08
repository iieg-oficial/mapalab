const Svg = ({ className = 'size-4', children, relleno = false }) => (
    <svg
        viewBox="0 0 24 24"
        className={className}
        fill={relleno ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
    >
        {children}
    </svg>
);

export const IconoArriba = (props) => <Svg {...props}><path d="M6 15l6-6 6 6" /></Svg>;

export const IconoAbajo = (props) => <Svg {...props}><path d="M6 9l6 6 6-6" /></Svg>;

export const IconoCerrar = (props) => <Svg {...props}><path d="M18 6L6 18M6 6l12 12" /></Svg>;

export const IconoMas = (props) => <Svg {...props}><path d="M12 5v14M5 12h14" /></Svg>;

export const IconoDeshacer = (props) => <Svg {...props}><path d="M9 14L4 9l5-5" /><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11" /></Svg>;

export const IconoRehacer = (props) => <Svg {...props}><path d="M15 14l5-5-5-5" /><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13" /></Svg>;

export const IconoLink = (props) => <Svg {...props}><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" /><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" /></Svg>;

export const IconoAlerta = (props) => <Svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></Svg>;

export const IconoBasura = (props) => <Svg {...props}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" /></Svg>;

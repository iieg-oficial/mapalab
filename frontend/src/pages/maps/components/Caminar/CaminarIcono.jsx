const TRAZOS = {
    primera: (
        <>
            <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12z" />
            <circle cx="12" cy="12" r="2.6" />
        </>
    ),
    tercera: (
        <>
            <circle cx="12" cy="7" r="2.4" />
            <path d="M8 21v-5.5a4 4 0 0 1 8 0V21" />
            <path d="M3 21h18" />
        </>
    ),
    teclas: (
        <>
            <rect x="2.5" y="6" width="19" height="12" rx="2" />
            <path d="M6.5 10h.01M10 10h.01M14 10h.01M17.5 10h.01M7.5 14h9" />
        </>
    ),
};

const CaminarIcono = ({ nombre, className = 'size-6' }) => (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {TRAZOS[nombre]}
    </svg>
);

export default CaminarIcono;

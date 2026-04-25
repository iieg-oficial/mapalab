import Tag from '@components/Tag';

export default function CompareButton({ onClick, disabled = false, className = '' }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            <span className="text-sm">Comparar fechas</span>
            <Tag state="beta" size="xs" />
        </button>
    );
}

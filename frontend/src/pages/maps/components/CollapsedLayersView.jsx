const CollapsedLayersView = ({ 
    unifiedLayers, 
    isManuallyCollapsed, 
    shouldAlignRight, 
    onExpand 
}) => {
    return (
        <div className={`
            w-12 h-12 rounded-xl shadow bg-white/80  shrink-0
            ${shouldAlignRight ? 'ml-auto' : ''}
        `}>
            <button
                onClick={() => (unifiedLayers.length > 0 || isManuallyCollapsed) && onExpand()}
                className={`
                    p-3 w-full h-full flex items-center justify-center text-gray-600  
                    rounded-xl transition-colors relative
                    ${(unifiedLayers.length > 0 || isManuallyCollapsed) ? 'hover:bg-gray-100  cursor-pointer' : 'cursor-default opacity-50'}
                `}
                title={
                    isManuallyCollapsed 
                        ? 'Expandir Panel de Capas' 
                        : unifiedLayers.length > 0 
                            ? 'Expandir Panel de Capas' 
                            : 'No hay capas activas'
                }
                disabled={unifiedLayers.length === 0 && !isManuallyCollapsed}
            >
                <span className="text-xl">🗂️</span>
                {unifiedLayers.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unifiedLayers.length}
                    </span>
                )}
                {isManuallyCollapsed && unifiedLayers.length === 0 && (
                    <span className="absolute -top-1 -right-1 bg-gray-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        ➖
                    </span>
                )}
            </button>
        </div>
    );
};

export default CollapsedLayersView;
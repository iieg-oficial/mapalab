const Divider = ({
    orientation = 'horizontal',
    className = '',
    thickness,
    spacingClass,
    colorClass = 'bg-black/10',
    ...props
}) => {
    const isVertical = orientation === 'vertical';
    const spacing = spacingClass ?? (isVertical ? 'mx-1' : 'my-1');
    const sizeClass = isVertical ? 'h-full' : 'w-full';
    const thicknessClass = thickness ?? (isVertical ? 'w-px' : 'h-px');

    return (
        <div
            role="separator"
            aria-orientation={orientation}
            className={`${spacing} ${sizeClass} ${thicknessClass} shrink-0 ${colorClass} ${className}`.trim()}
            {...props}
        />
    );
};

export default Divider;

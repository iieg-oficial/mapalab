const Divider = ({
    orientation = 'horizontal',
    className = '',
    thickness,
    spacingClass,
    colorClass,
    ...props
}) => {
    const isVertical = orientation === 'vertical';
    const defaultSpacing = spacingClass ?? (isVertical ? 'mx-1' : 'my-1');
    const sizeClass = isVertical ? 'h-full' : 'w-full';
    const defaultThickness = thickness ?? (isVertical ? 'w-px' : 'h-px');
    const defaultColor = colorClass ?? 'bg-black/10';

    const hasCustomSpacing = /(^|\s)(m|my|mx|mt|mb|ml|mr|p|py|px|pt|pb|pl|pr)-/.test(className);
    const hasCustomColor = /(^|\s)bg-/.test(className);
    const hasCustomThickness = isVertical ? /(^|\s)w-/.test(className) : /(^|\s)h-/.test(className);

    const finalClasses = [
        !hasCustomSpacing && defaultSpacing,
        sizeClass,
        !hasCustomThickness && defaultThickness,
        'shrink-0',
        !hasCustomColor && defaultColor,
        className
    ].filter(Boolean).join(' ');

    return (
        <div
            role="separator"
            aria-orientation={orientation}
            className={finalClasses}
            {...props}
        />
    );
};

export default Divider;

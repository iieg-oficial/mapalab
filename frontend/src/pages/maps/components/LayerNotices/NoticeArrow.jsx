import { SIZE_ARROW } from '@pages/maps/helpers/noticeHelpers';

const VARIANT_ARROW_FILL = {
    info: '#5C2472',
    warning: '#FF8300',
    neutral: '#FFFFFF',
};

const VARIANT_ARROW_STROKE = {
    info: 'none',
    warning: 'none',
    neutral: '#9CA3AF',
};

const arrowGeometry = (position, arrowSize) => {
    const wide = arrowSize * 2;
    switch (position) {
    case 'top':
        return {
            viewBox: `0 0 ${wide} ${arrowSize}`,
            points: `${wide / 2},0 ${wide},${arrowSize} 0,${arrowSize}`,
            width: wide,
            height: arrowSize,
            wrapper: { left: '50%', transform: 'translateX(-50%)', top: -arrowSize },
        };
    case 'left':
        return {
            viewBox: `0 0 ${arrowSize} ${wide}`,
            points: `0,${wide / 2} ${arrowSize},0 ${arrowSize},${wide}`,
            width: arrowSize,
            height: wide,
            wrapper: { top: '50%', transform: 'translateY(-50%)', left: -arrowSize },
        };
    case 'right':
        return {
            viewBox: `0 0 ${arrowSize} ${wide}`,
            points: `${arrowSize},${wide / 2} 0,0 0,${wide}`,
            width: arrowSize,
            height: wide,
            wrapper: { top: '50%', transform: 'translateY(-50%)', right: -arrowSize },
        };
    case 'bottom':
    default:
        return {
            viewBox: `0 0 ${wide} ${arrowSize}`,
            points: `0,0 ${wide},0 ${wide / 2},${arrowSize}`,
            width: wide,
            height: arrowSize,
            wrapper: { left: '50%', transform: 'translateX(-50%)', bottom: -arrowSize },
        };
    }
};

const NoticeArrow = ({ variant, position = 'bottom', size = 'large' }) => {
    const fill = VARIANT_ARROW_FILL[variant] || VARIANT_ARROW_FILL.info;
    const stroke = VARIANT_ARROW_STROKE[variant] || 'none';
    const arrowSize = SIZE_ARROW[size] || SIZE_ARROW.large;
    const geom = arrowGeometry(position, arrowSize);
    return (
        <svg
            aria-hidden="true"
            width={geom.width}
            height={geom.height}
            viewBox={geom.viewBox}
            style={{
                position: 'absolute',
                filter: 'drop-shadow(0px 3px 24px #00000029)',
                ...geom.wrapper,
            }}
        >
            <polygon points={geom.points} fill={fill} stroke={stroke} strokeWidth={stroke === 'none' ? 0 : 1.5} />
        </svg>
    );
};

export default NoticeArrow;

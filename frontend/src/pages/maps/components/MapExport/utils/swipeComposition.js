import { SLOT_COLORS, SWIPE_HANDLE_COLOR } from '@pages/maps/helpers/swipeTheme';

const SLOT_FILL = { A: SLOT_COLORS.A.fg, B: SLOT_COLORS.B.fg };
const SLOT_BG = { A: SLOT_COLORS.A.bg, B: SLOT_COLORS.B.bg };
const HANDLE_COLOR = SWIPE_HANDLE_COLOR;

const drawRoundedRect = (ctx, x, y, w, h, r) => {
    const radius = Math.min(r, h / 2, w / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
};

const drawCombinedPill = (ctx, { x, y, label, slot, fontSize, paddingX, paddingY, anchor = 'left' }) => {
    ctx.font = `bold ${fontSize}px sans-serif`;
    const badgeText = slot;
    const badgeW = ctx.measureText(badgeText).width + paddingX * 1.4;
    const labelW = ctx.measureText(label).width + paddingX * 1.4;
    const totalW = badgeW + labelW;
    const h = fontSize + paddingY * 2;
    const drawX = anchor === 'right' ? x - totalW : x;
    const radius = h / 2;
    const badgeFirst = slot === 'A';
    const badgeX = badgeFirst ? drawX : drawX + labelW;
    const labelX = badgeFirst ? drawX + badgeW : drawX;

    ctx.fillStyle = SLOT_BG[slot] || '#ffffff';
    drawRoundedRect(ctx, drawX, y, totalW, h, radius);
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.rect(badgeX, y, badgeW, h);
    ctx.clip();
    drawRoundedRect(ctx, drawX, y, totalW, h, radius);
    ctx.fillStyle = SLOT_FILL[slot] || '#000000';
    ctx.fill();
    ctx.restore();

    ctx.lineWidth = 2;
    ctx.strokeStyle = SLOT_FILL[slot] || '#000000';
    drawRoundedRect(ctx, drawX, y, totalW, h, radius);
    ctx.stroke();

    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(badgeText, badgeX + badgeW / 2, y + h / 2);
    ctx.fillStyle = SLOT_FILL[slot] || '#000000';
    ctx.fillText(label, labelX + labelW / 2, y + h / 2);
};

const drawDivider = (ctx, { width, height, position, orientation }) => {
    ctx.fillStyle = HANDLE_COLOR;
    if (orientation === 'horizontal') {
        const y = (position / 100) * height;
        ctx.fillRect(0, y - 2, width, 4);
    } else {
        const x = (position / 100) * width;
        ctx.fillRect(x - 2, 0, 4, height);
    }
};

export const composeSwipeCanvas = ({
    canvasA,
    canvasB,
    width,
    height,
    swipePosition = 50,
    orientation = 'vertical',
    swipeOptions = {},
}) => {
    const out = document.createElement('canvas');
    out.width = width;
    out.height = height;
    const ctx = out.getContext('2d');

    if (canvasA) ctx.drawImage(canvasA, 0, 0, width, height);

    if (canvasB) {
        ctx.save();
        ctx.beginPath();
        if (orientation === 'horizontal') {
            const yCut = (swipePosition / 100) * height;
            ctx.rect(0, yCut, width, height - yCut);
        } else {
            const xCut = (swipePosition / 100) * width;
            ctx.rect(xCut, 0, width - xCut, height);
        }
        ctx.clip();
        ctx.drawImage(canvasB, 0, 0, width, height);
        ctx.restore();
    }

    const { swipeBar = true, swipePills = true, pills = [] } = swipeOptions;

    if (swipeBar) drawDivider(ctx, { width, height, position: swipePosition, orientation });

    if (swipePills && pills.length) {
        const fontSize = 32;
        const padX = 26;
        const padY = 16;
        const top = 28;
        pills.forEach(({ slot, label }) => {
            if (!label) return;
            const isA = slot === 'A';
            drawCombinedPill(ctx, {
                x: isA ? 24 : width - 24,
                y: top,
                label,
                slot,
                fontSize,
                paddingX: padX,
                paddingY: padY,
                anchor: isA ? 'left' : 'right',
            });
        });
    }

    return out;
};

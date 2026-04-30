const SLOT_FILL = { A: '#5C2472', B: '#FF8300' };
const SLOT_BG = { A: '#F0EAF3', B: '#FFF2E5' };
const HANDLE_COLOR = '#FF8300';

const drawRoundedRect = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
};

const drawPill = (ctx, { x, y, label, slot, fontSize, paddingX, paddingY, anchor = 'left' }) => {
    ctx.font = `bold ${fontSize}px sans-serif`;
    const metrics = ctx.measureText(label);
    const textW = metrics.width;
    const w = textW + paddingX * 2;
    const h = fontSize + paddingY * 2;
    const drawX = anchor === 'right' ? x - w : x;
    const radius = h / 2;
    ctx.fillStyle = SLOT_BG[slot] || '#ffffff';
    drawRoundedRect(ctx, drawX, y, w, h, radius);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = SLOT_FILL[slot] || '#000000';
    ctx.stroke();
    ctx.fillStyle = SLOT_FILL[slot] || '#000000';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(label, drawX + w / 2, y + h / 2);
};

const drawSimpleLabel = (ctx, { x, y, text, anchor = 'left', fontSize = 14 }) => {
    ctx.font = `500 ${fontSize}px sans-serif`;
    const metrics = ctx.measureText(text);
    const w = metrics.width + 24;
    const h = fontSize + 12;
    const drawX = anchor === 'right' ? x - w : x;
    drawRoundedRect(ctx, drawX, y, w, h, h / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = '#d1d5db';
    ctx.stroke();
    ctx.fillStyle = '#374151';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(text, drawX + w / 2, y + h / 2);
};

const drawDivider = (ctx, { width, height, position, orientation }) => {
    ctx.fillStyle = HANDLE_COLOR;
    if (orientation === 'horizontal') {
        const y = (position / 100) * height;
        ctx.fillRect(0, y - 2, width, 4);
        ctx.beginPath();
        ctx.arc(width / 2, y, 28, 0, Math.PI * 2);
        ctx.fill();
    } else {
        const x = (position / 100) * width;
        ctx.fillRect(x - 2, 0, 4, height);
        ctx.beginPath();
        ctx.arc(x, height / 2, 28, 0, Math.PI * 2);
        ctx.fill();
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
    labelA = 'A',
    labelB = 'B',
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

    const { swipeBar = true, swipeLabels = true, swipePills = false, pills = [] } = swipeOptions;

    if (swipeBar) drawDivider(ctx, { width, height, position: swipePosition, orientation });

    if (swipeLabels) {
        if (orientation === 'horizontal') {
            drawSimpleLabel(ctx, { x: 16, y: 12, text: labelA });
            drawSimpleLabel(ctx, { x: 16, y: height - 12 - 26, text: labelB });
        } else {
            drawSimpleLabel(ctx, { x: 16, y: 12, text: labelA });
            drawSimpleLabel(ctx, { x: width - 16, y: 12, text: labelB, anchor: 'right' });
        }
    }

    if (swipePills && pills.length) {
        const fontSize = 22;
        const padX = 18;
        const padY = 12;
        const top = 60;
        pills.forEach(({ slot, label }) => {
            if (!label) return;
            const isA = slot === 'A';
            drawPill(ctx, {
                x: isA ? 16 : width - 16,
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

const TONES = {
    purple: {
        text: 'text-[#703089]',
        border: 'border-[#703089]',
        bg: 'bg-[#F0EAF3]',
        hover: 'hover:bg-[#F0EAF3] hover:border-[#703089]',
    },
    orange: {
        text: 'text-[#FF8300]',
        border: 'border-[#FF8300]',
        bg: 'bg-[#FFF2E5]',
        hover: 'hover:bg-[#FFF2E5] hover:border-[#FF8300]',
    },
};

const IDLE_BG = 'bg-[#F9FBFF]';
const IDLE_BORDER = 'border-[#F9FBFF]';
const DISABLED = 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed';

export const RADIUS_LABEL = 'rounded-[14px]';
export const RADIUS_ICON = 'rounded-full';

export const toneStateFor = (slot, changed = false) => {
    if (slot === 'A') return { tone: 'purple', active: true };
    if (slot === 'B') return { tone: 'orange', active: true };
    return { tone: changed ? 'orange' : 'purple', active: changed };
};

export const toneTextClass = (tone) => (TONES[tone] || TONES.purple).text;

export const toneClasses = (tone, { active = false, disabled = false, idleBg = IDLE_BG, idleBorder = IDLE_BORDER } = {}) => {
    if (disabled) return `border ${DISABLED}`;
    const t = TONES[tone] || TONES.purple;
    const surface = active ? `${t.bg} ${t.border}` : `${idleBg} ${idleBorder}`;
    return `border transition-colors ${t.text} ${surface} ${t.hover}`;
};

export const toneButtonFor = (slot, changed, options = {}) => {
    const { tone, active } = toneStateFor(slot, changed);
    return { tone, active, className: toneClasses(tone, { ...options, active }) };
};

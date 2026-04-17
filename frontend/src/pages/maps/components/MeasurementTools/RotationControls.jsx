import { useState } from 'react';
import Icon from '@components/Icon';
import Tooltip from '@components/Tooltip';

const STEP = 45;

const RotationControls = ({ rotation = 0, onChange, title = 'Rotación' }) => {
    const currentDegrees = Math.round((rotation * 180) / Math.PI);
    const [inputValue, setInputValue] = useState(currentDegrees.toString());
    const [isEditing, setIsEditing] = useState(false);

    const setDegrees = (degrees) => {
        onChange?.((degrees * Math.PI) / 180);
    };

    const handleEditStart = () => {
        setIsEditing(true);
        setInputValue(currentDegrees.toString());
    };

    const handleInputBlur = () => {
        setIsEditing(false);
        const num = parseInt(inputValue, 10);
        if (!isNaN(num)) {
            setDegrees(((num % 360) + 360) % 360);
        }
    };

    const handleInputKey = (e) => {
        if (e.key === 'Enter') e.target.blur();
        else if (e.key === 'Escape') {
            setIsEditing(false);
            setInputValue(currentDegrees.toString());
        }
    };

    const iconBtn = 'size-7 flex items-center justify-center rounded-full border border-transparent hover:border-[#70308A] hover:bg-[#F9FBFF] transition-colors cursor-pointer';

    const degreeDisplay = isEditing ? (
        <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKey}
            autoFocus
            className="w-14 text-center font-garet font-medium text-[12px] text-[#465055] bg-transparent border border-[#70308A] rounded px-1 outline-none"
        />
    ) : (
        <button
            type="button"
            onClick={handleEditStart}
            className="w-14 text-center font-garet font-medium text-[12px] text-[#465055] hover:bg-black/5 rounded px-1 cursor-pointer transition-colors"
            title="Click para editar"
        >
            {currentDegrees}°
        </button>
    );

    return (
        <div className="flex items-center gap-2">
            {title && (
                <span className="font-garet font-bold text-[12px] text-[#465055] shrink-0 mr-1">
                    {title}
                </span>
            )}

            <Tooltip content={`Rotar -${STEP}°`} delay={500}>
                <button
                    type="button"
                    onClick={() => setDegrees(currentDegrees - STEP)}
                    className={iconBtn}
                    aria-label={`Rotar -${STEP}°`}
                >
                    <Icon name="undo" className="size-4" />
                </button>
            </Tooltip>

            {degreeDisplay}

            <Tooltip content={`Rotar +${STEP}°`} delay={500}>
                <button
                    type="button"
                    onClick={() => setDegrees(currentDegrees + STEP)}
                    className={iconBtn}
                    aria-label={`Rotar +${STEP}°`}
                >
                    <span className="inline-flex scale-x-[-1]">
                        <Icon name="undo" className="size-4" />
                    </span>
                </button>
            </Tooltip>

            <Tooltip content="Resetear" delay={500}>
                <button
                    type="button"
                    onClick={() => setDegrees(0)}
                    className={iconBtn}
                    aria-label="Resetear rotación"
                >
                    <Icon name="refresh" className="size-4" />
                </button>
            </Tooltip>
        </div>
    );
};

export default RotationControls;

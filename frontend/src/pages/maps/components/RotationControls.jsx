import { useState } from 'react';
import Icon from '@components/Icon';

const RotationControls = ({ showTitle = true, rotation, onChange, compact = false }) => {
    const currentDegrees = Math.round((rotation * 180) / Math.PI);
    const [inputValue, setInputValue] = useState(currentDegrees.toString());
    const [isEditing, setIsEditing] = useState(false);

    const handleRotate = (degrees) => {
        onChange?.((degrees * Math.PI) / 180);
    };

    const handleInputClick = () => {
        setIsEditing(true);
        setInputValue(currentDegrees.toString());
    };

    const handleInputChange = (e) => {
        setInputValue(e.target.value);
    };

    const handleInputBlur = () => {
        setIsEditing(false);
        const numValue = parseInt(inputValue, 10);
        if (!isNaN(numValue)) {
            const normalizedValue = ((numValue % 360) + 360) % 360;
            handleRotate(normalizedValue);
        }
    };

    const handleInputKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.target.blur();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setInputValue(currentDegrees.toString());
        }
    };

    const degreeDisplay = isEditing ? (
        <input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            autoFocus
            className="w-16 text-center text-sm font-semibold text-zinc-700  bg-transparent border border-blue-500 rounded px-1 outline-none"
        />
    ) : (
        <button
            type="button"
            onClick={handleInputClick}
            className="w-16 text-center text-sm font-semibold text-zinc-700  hover:bg-black/5  rounded px-1 transition"
            title="Click para editar"
        >
            {currentDegrees}°
        </button>
    );

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => handleRotate(currentDegrees - 45)}
                    className="p-1.5 hover:bg-black/5  rounded-lg transition"
                    aria-label="Rotar -45°"
                    title="Rotar -45°"
                >
                    <Icon name="undo" />
                </button>
                {degreeDisplay}
                <button
                    type="button"
                    onClick={() => handleRotate(currentDegrees + 45)}
                    className="p-1.5 hover:bg-black/5  rounded-lg transition"
                    aria-label="Rotar +45°"
                    title="Rotar +45°"
                >
                    <div className="transform scale-x-[-1]">
                        <Icon name="undo" />
                    </div>
                </button>
                <button
                    type="button"
                    onClick={() => handleRotate(0)}
                    className="p-1.5 hover:bg-black/5  rounded-lg transition"
                    aria-label="Resetear rotación"
                    title="Resetear"
                >
                    <Icon name="refresh" />
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-2">

            {showTitle && (
                <div className="text-xs font-semibold text-gray-600 ">
                    Rotation
                </div>
            )}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => handleRotate(currentDegrees - 45)}
                    className="p-1.5 hover:bg-black/5  rounded-lg transition"
                    aria-label="Rotar -45°"
                    title="Rotar -45°"
                >
                    <Icon name="undo" />
                </button>
                {degreeDisplay}
                <button
                    type="button"
                    onClick={() => handleRotate(currentDegrees + 45)}
                    className="p-1.5 hover:bg-black/5  rounded-lg transition"
                    aria-label="Rotar +45°"
                    title="Rotar +45°"
                >
                    <div className="transform scale-x-[-1]">
                        <Icon name="undo" />
                    </div>
                </button>
                <button
                    type="button"
                    onClick={() => handleRotate(0)}
                    className="p-1.5 hover:bg-black/5  rounded-lg transition"
                    aria-label="Resetear rotación"
                    title="Resetear"
                >
                    <Icon name="refresh" />
                </button>
            </div>
        </div>
    );
};

export default RotationControls;

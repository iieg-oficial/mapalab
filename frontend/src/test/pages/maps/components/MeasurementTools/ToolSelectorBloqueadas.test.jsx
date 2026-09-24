import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import ToolSelector from '@pages/maps/components/MeasurementTools/ToolSelector';

describe('ToolSelector con herramientas bloqueadas', () => {
    it('las bloqueadas no responden al clic y las demás sí', () => {
        const onTextToggle = vi.fn();
        const onEmojiToggle = vi.fn();
        const { container } = render(
            <ToolSelector showMeasurements={false} onTextToggle={onTextToggle} onEmojiToggle={onEmojiToggle} bloqueadas={['Text', 'Freehand']} />,
        );
        const botones = [...container.querySelectorAll('button')];
        const bloqueados = botones.filter(b => b.getAttribute('aria-disabled') === 'true');
        expect(bloqueados).toHaveLength(2);
        bloqueados.forEach(b => fireEvent.click(b));
        expect(onTextToggle).not.toHaveBeenCalled();
        fireEvent.click(botones.find(b => !b.getAttribute('aria-disabled')));
        expect(onEmojiToggle).toHaveBeenCalled();
    });
});

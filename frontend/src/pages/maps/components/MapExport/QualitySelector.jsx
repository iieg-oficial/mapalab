import { useState, useEffect } from 'react';
import Bar from '@components/Bar';
import Tooltip from '@components/Tooltip';
import { QUALITY_PRESETS } from './utils/exportDimensions';

const THUMB_SIZE = 16;

const QUALITY_WARNINGS = [
    null,
    null,
    { variant: 'normal', content: 'Algunas capas podrían no aparecer correctamente.' },
    { variant: 'warning', content: 'Algunas capas podrían no aparecer correctamente y puede afectar el rendimiento del navegador.' },
];

const QualitySelector = ({ value, onChange, isPanelOpen }) => {
    const [tooltipReady, setTooltipReady] = useState(false);

    useEffect(() => {
        if (!isPanelOpen || value < 2) {
            setTooltipReady(false);
            return;
        }
        const timer = setTimeout(() => setTooltipReady(true), 300);
        return () => clearTimeout(timer);
    }, [isPanelOpen, value]);

    const pct = value / (QUALITY_PRESETS.length - 1);
    const warning = QUALITY_WARNINGS[value];

    return (
        <div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Calidad
            </div>
            <div className="relative">
                <Bar
                    min={0}
                    max={QUALITY_PRESETS.length - 1}
                    step={1}
                    value={value}
                    onChange={e => onChange(Number(e.target.value))}
                />
                {warning && tooltipReady && (
                    <div
                        key={value}
                        className="absolute top-0 bottom-0 flex items-center pointer-events-none"
                        style={{
                            left: `calc(${pct * 100}% + ${THUMB_SIZE / 2 - pct * THUMB_SIZE}px)`,
                            transform: 'translateX(-50%)'
                        }}
                    >
                        <Tooltip
                            forceVisible
                            content={warning.content}
                            variant={warning.variant}
                            placement="top"
                            delay={0}
                        >
                            <span className="block w-3 h-3" />
                        </Tooltip>
                    </div>
                )}
            </div>
            <div className="flex justify-between mt-1">
                {QUALITY_PRESETS.map((p, i) => (
                    <span
                        key={i}
                        onClick={() => onChange(i)}
                        className={`text-xs cursor-pointer transition-colors ${i === value ? 'text-[#FF8300] font-bold' : 'text-gray-400'}`}
                    >
                        {p.label}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default QualitySelector;

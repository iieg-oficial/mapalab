import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { renderCard } from '@pages/maps/components/InfoBox/utils/renderCard';

const tarjeta = (properties, config) => render(renderCard(properties, config, null, null, null, null, 'desktop', 1, 1, null));

describe('formato anio en la tarjeta', () => {
    it('una etiqueta con formato anio muestra solo el año', () => {
        tarjeta({ fecha: '2024-01-01' }, { labelGroups: [{ fields: [{ field: 'fecha', formato: 'anio' }] }] });
        expect(screen.getByText('2024')).toBeInTheDocument();
        expect(screen.queryByText('2024-01-01')).not.toBeInTheDocument();
    });

    it('una etiqueta sin formato sigue mostrando la fecha completa', () => {
        tarjeta({ fecha: '2024-01-01' }, { labelGroups: [{ fields: ['fecha'] }] });
        expect(screen.getByText('2024-01-01')).toBeInTheDocument();
    });

    it('un renglon con formato anio muestra el año sin agruparlo como numero', () => {
        tarjeta({ fecha: '2026-06-01' }, { list: [{ field: 'fecha', label: 'Año del cálculo', formato: 'anio' }] });
        expect(screen.getByText('2026')).toBeInTheDocument();
    });

    it('la regla vieja por etiqueta sigue funcionando sin formato', () => {
        tarjeta({ fecha: '2026-06-01' }, { list: [{ field: 'fecha', label: 'Año de la información', raw: true }] });
        expect(screen.getByText('2026')).toBeInTheDocument();
    });

    it('un parrafo con formato anio muestra el año', () => {
        tarjeta({ fecha: '2025-12-31' }, { text: [{ id: 't0', items: [{ field: 'fecha', formato: 'anio' }] }] });
        expect(screen.getByText('2025')).toBeInTheDocument();
    });
});

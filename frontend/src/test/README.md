# Testing con Vitest

Este proyecto usa [Vitest](https://vitest.dev/) para testing con las siguientes librerías:
- **@testing-library/react**: Para testing de componentes React
- **@testing-library/jest-dom**: Matchers adicionales para el DOM
- **@testing-library/user-event**: Para simular interacciones de usuario
- **jsdom**: Entorno de DOM para Node.js

## Instalación

```bash
npm install --legacy-peer-deps
```

## Comandos disponibles

```bash
# Ejecutar tests en modo watch (recomendado durante desarrollo)
npm test

# Ejecutar tests una sola vez
npx vitest run

# Ejecutar tests con interfaz visual
npm run test:ui

# Ejecutar tests con reporte de cobertura
npm run test:coverage
```

## � Inventario de tests — 24 archivos, 344 tests

### Componentes UI (5 archivos — 57 tests)

| Archivo | Tests |
|---|---|
| `components/Alert.test.jsx` | 15 |
| `components/Badge.test.jsx` | 7 |
| `components/Checkbox.test.jsx` | 12 |
| `components/Modal.test.jsx` | 12 |
| `components/Switch.test.jsx` | 11 |

### Hooks generales (3 archivos — 21 tests)

| Archivo | Tests |
|---|---|
| `hooks/useDebounce.test.js` | 6 |
| `hooks/useOutsideClick.test.js` | 7 |
| `hooks/useScrollOverflow.test.js` | 8 |

### Hooks del mapa (7 archivos — 89 tests)

| Archivo | Tests |
|---|---|
| `pages/maps/hooks/useAccordion.test.js` | 12 |
| `pages/maps/hooks/useActiveLayersLogic.test.js` | 3 |
| `pages/maps/hooks/useCQLFilter.test.js` | 18 |
| `pages/maps/hooks/useDateSelections.test.js` | 26 |
| `pages/maps/hooks/useLayerManagement.test.js` | 13 |
| `pages/maps/hooks/useLayerOpacity.test.js` | 9 |
| `pages/maps/hooks/useLayerToggle.test.js` | 8 |

### Helpers del mapa (2 archivos — 50 tests)

| Archivo | Tests |
|---|---|
| `pages/maps/helpers/layerHelpers.test.js` | 22 |
| `pages/maps/helpers/wmsConfig.test.js` | 28 |

### Servicios (5 archivos — 103 tests)

| Archivo | Tests |
|---|---|
| `services/analyticsService.test.js` | 21 |
| `services/downloadService.test.js` | 16 |
| `services/layerMetadataService.test.js` | 14 |
| `services/searchConfig.test.js` | 24 |
| `services/searchService.test.js` | 28 |

### Utils (1 archivo — 21 tests)

| Archivo | Tests |
|---|---|
| `utils/featureInfoUtils.test.js` | 21 |

### Otros (1 archivo — 3 tests)

| Archivo | Tests |
|---|---|
| `example.test.jsx` | 3 |

## Estructura de tests

Convención `*.test.js` / `*.test.jsx`, ubicados en `src/test/`:

```
src/test/
├── setup.js
├── example.test.jsx
├── components/
│   ├── Alert.test.jsx
│   ├── Badge.test.jsx
│   ├── Checkbox.test.jsx
│   ├── Modal.test.jsx
│   └── Switch.test.jsx
├── hooks/
│   ├── useDebounce.test.js
│   ├── useOutsideClick.test.js
│   └── useScrollOverflow.test.js
├── pages/maps/
│   ├── helpers/
│   │   ├── layerHelpers.test.js
│   │   └── wmsConfig.test.js
│   └── hooks/
│       ├── useAccordion.test.js
│       ├── useActiveLayersLogic.test.js
│       ├── useCQLFilter.test.js
│       ├── useDateSelections.test.js
│       ├── useLayerManagement.test.js
│       ├── useLayerOpacity.test.js
│       └── useLayerToggle.test.js
├── services/
│   ├── analyticsService.test.js
│   ├── downloadService.test.js
│   ├── layerMetadataService.test.js
│   ├── searchConfig.test.js
│   └── searchService.test.js
└── utils/
    └── featureInfoUtils.test.js
```

## Escribir un test

### Componente

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MiComponente from './MiComponente';

describe('MiComponente', () => {
    it('should render correctly', () => {
        render(<MiComponente />);
        expect(screen.getByText('Hola')).toBeInTheDocument();
    });
});
```

### Funciones puras

```js
import { describe, it, expect } from 'vitest';
import { miFuncion } from '@pages/maps/helpers/miHelper';

describe('miFuncion', () => {
    it('retorna el valor esperado', () => {
        expect(miFuncion('input')).toBe('output');
    });
});
```

### Servicios con mocks

```js
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@pages/maps/helpers/layers', () => ({
    layers: [],
    findLayerById: vi.fn()
}));

beforeEach(() => {
    global.fetch = vi.fn();
    vi.spyOn(console, 'error').mockImplementation(() => {});
});
```

## Matchers útiles de jest-dom

```jsx
expect(element).toBeInTheDocument()
expect(element).toHaveTextContent('texto')
expect(element).toHaveClass('clase')
expect(element).toBeVisible()
expect(element).toBeDisabled()
expect(element).toHaveAttribute('attr', 'value')
```

## Cobertura de código

```bash
npm run test:coverage
```

## Enlaces útiles

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

# Testing con Vitest

Este proyecto usa [Vitest](https://vitest.dev/) para testing con las siguientes librerías:
- **@testing-library/react**: Para testing de componentes React
- **@testing-library/jest-dom**: Matchers adicionales para el DOM
- **@testing-library/user-event**: Para simular interacciones de usuario
- **jsdom**: Entorno de DOM para Node.js

## 📦 Instalación

```bash
npm install
```

## 🚀 Comandos disponibles

```bash
# Ejecutar tests en modo watch (recomendado durante desarrollo)
npm test

# Ejecutar tests con interfaz visual
npm run test:ui

# Ejecutar tests con reporte de cobertura
npm run test:coverage
```

## 📝 Estructura de tests

Los archivos de test deben seguir la convención:
- `*.test.js` o `*.test.jsx` - Para tests de componentes/funciones
- `*.spec.js` o `*.spec.jsx` - Alternativa aceptada

Ejemplo de ubicación:
```
src/
  components/
    Button.jsx
    Button.test.jsx
  hooks/
    useMaps.js
    useMaps.test.js
  test/
    setup.js          # Configuración global
    example.test.jsx  # Ejemplo de test
```

## ✍️ Escribir un test

### Test básico de componente

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

### Test con interacción de usuario

```jsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from './Button';

describe('Button', () => {
    it('should call onClick when clicked', async () => {
        const user = userEvent.setup();
        const handleClick = vi.fn();

        render(<Button onClick={handleClick}>Click me</Button>);

        await user.click(screen.getByRole('button'));
        expect(handleClick).toHaveBeenCalledOnce();
    });
});
```

### Test de custom hooks

```jsx
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
    it('should increment counter', () => {
        const { result } = renderHook(() => useCounter());

        act(() => {
            result.current.increment();
        });

        expect(result.current.count).toBe(1);
    });
});
```

### Test con mocks

```jsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import axios from 'axios';

vi.mock('axios');

describe('DataFetcher', () => {
    it('should fetch and display data', async () => {
        axios.get.mockResolvedValue({ data: { name: 'Test' } });

        render(<DataFetcher />);

        expect(await screen.findByText('Test')).toBeInTheDocument();
    });
});
```

## 🎯 Matchers útiles de jest-dom

```jsx
expect(element).toBeInTheDocument()
expect(element).toHaveTextContent('texto')
expect(element).toHaveClass('clase')
expect(element).toBeVisible()
expect(element).toBeDisabled()
expect(element).toHaveAttribute('attr', 'value')
```

## 📊 Cobertura de código

El reporte de cobertura se genera en `/coverage` y muestra:
- % de líneas cubiertas
- % de funciones cubiertas
- % de branches cubiertas
- % de statements cubiertas

```bash
npm run test:coverage
# Abre coverage/index.html en el navegador para ver el reporte visual
```

## 🔗 Enlaces útiles

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

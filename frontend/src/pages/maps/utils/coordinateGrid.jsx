import coordinateLabels from './coordinateLabels';

const coordinateGrid = (width, height) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.zIndex = '5';
    container.style.pointerEvents = 'none';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', width);
    svg.setAttribute('height', height);
    svg.style.position = 'absolute';
    svg.style.top = '0';
    svg.style.left = '0';

    const gridSize = 50;

    for (let i = 1; i < width / gridSize; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', gridSize * i);
        line.setAttribute('y1', 0);
        line.setAttribute('x2', gridSize * i);
        line.setAttribute('y2', height);
        line.setAttribute('stroke', 'rgba(0, 0, 0, 0.3)');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('stroke-dasharray', '3,3');
        svg.appendChild(line);
    }

    for (let i = 1; i < height / gridSize; i++) {
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', 0);
        line.setAttribute('y1', gridSize * i);
        line.setAttribute('x2', width);
        line.setAttribute('y2', gridSize * i);
        line.setAttribute('stroke', 'rgba(0, 0, 0, 0.3)');
        line.setAttribute('stroke-width', '1');
        line.setAttribute('stroke-dasharray', '3,3');
        svg.appendChild(line);
    }

    container.appendChild(svg);
    container.appendChild(coordinateLabels(height, width));

    return container;
};

export default coordinateGrid;
import coordinateLabels from './coordinateLabels';

const coordinateGrid = (width, height, extent = null) => {
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

    const gridSpacing = 80;
    const crossSize = 10;

    const cols = Math.floor(width / gridSpacing);
    const rows = Math.floor(height / gridSpacing);

    for (let i = 1; i < cols; i++) {
        for (let j = 1; j < rows; j++) {
            const x = i * gridSpacing;
            const y = j * gridSpacing;

            const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            hLine.setAttribute('x1', x - crossSize / 2);
            hLine.setAttribute('y1', y);
            hLine.setAttribute('x2', x + crossSize / 2);
            hLine.setAttribute('y2', y);
            hLine.setAttribute('stroke', 'rgba(0, 0, 0, 0.4)');
            hLine.setAttribute('stroke-width', '1');
            svg.appendChild(hLine);

            const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            vLine.setAttribute('x1', x);
            vLine.setAttribute('y1', y - crossSize / 2);
            vLine.setAttribute('x2', x);
            vLine.setAttribute('y2', y + crossSize / 2);
            vLine.setAttribute('stroke', 'rgba(0, 0, 0, 0.4)');
            vLine.setAttribute('stroke-width', '1');
            svg.appendChild(vLine);
        }
    }

    container.appendChild(svg);
    container.appendChild(coordinateLabels(height, width, extent));

    return container;
};

export default coordinateGrid;
const northArrow = () => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.width = '50px';
    container.style.height = '60px';
    container.style.zIndex = '1000';
    container.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    container.style.borderRadius = '6px';
    container.style.padding = '8px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.border = '1px solid #333';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '30');
    svg.setAttribute('height', '40');
    svg.setAttribute('viewBox', '0 0 40 50');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M20 5 L25 15 L20 12 L15 15 Z');
    path.setAttribute('fill', '#dc2626');
    path.setAttribute('stroke', '#000');
    path.setAttribute('stroke-width', '1');

    const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path2.setAttribute('d', 'M20 12 L25 15 L20 35 L15 15 Z');
    path2.setAttribute('fill', '#fff');
    path2.setAttribute('stroke', '#000');
    path2.setAttribute('stroke-width', '1');

    svg.appendChild(path);
    svg.appendChild(path2);

    const label = document.createElement('div');
    label.textContent = 'N';
    label.style.fontSize = '14px';
    label.style.fontWeight = 'bold';
    label.style.color = '#000';
    label.style.marginTop = '2px';

    container.appendChild(svg);
    container.appendChild(label);

    return container;
};

export default northArrow;
const northArrow = () => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '20px';
    container.style.left = '20px';
    container.style.width = '40px';
    container.style.height = '50px';
    container.style.zIndex = '1000';
    container.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
    container.style.borderRadius = '6px';
    container.style.padding = '6px';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.alignItems = 'center';
    container.style.justifyContent = 'center';
    container.style.border = '1px solid #333';
    container.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';

    const label = document.createElement('div');
    label.textContent = 'N';
    label.style.fontSize = '14px';
    label.style.fontWeight = 'bold';
    label.style.color = '#000';
    label.style.marginBottom = '2px';

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '30');
    svg.setAttribute('viewBox', '0 0 24 30');

    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrow.setAttribute('d', 'M12 0 L18 12 L12 8 L6 12 Z');
    arrow.setAttribute('fill', '#000');

    const arrowBottom = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arrowBottom.setAttribute('d', 'M12 8 L18 12 L12 28 L6 12 Z');
    arrowBottom.setAttribute('fill', '#fff');
    arrowBottom.setAttribute('stroke', '#000');
    arrowBottom.setAttribute('stroke-width', '1');

    svg.appendChild(arrowBottom);
    svg.appendChild(arrow);

    container.appendChild(label);
    container.appendChild(svg);

    return container;
};

export default northArrow;
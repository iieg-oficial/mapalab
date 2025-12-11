const coordinateLabels = (height, width) => {
    const labelContainer = document.createElement('div');
    labelContainer.style.position = 'absolute';
    labelContainer.style.top = '0';
    labelContainer.style.left = '0';
    labelContainer.style.width = '100%';
    labelContainer.style.height = '100%';
    labelContainer.style.pointerEvents = 'none';
    labelContainer.style.fontSize = '10px';
    labelContainer.style.color = 'rgba(0, 0, 0, 0.6)';
    labelContainer.style.fontWeight = 'bold';

    for (let i = 0; i <= width; i += 100) {
        const label = document.createElement('div');
        label.style.position = 'absolute';
        label.style.bottom = '5px';
        label.style.left = `${i}px`;
        label.style.transform = 'translateX(-50%)';
        label.textContent = `${i}`;
        labelContainer.appendChild(label);
    }

    for (let i = 0; i <= height; i += 100) {
        const label = document.createElement('div');
        label.style.position = 'absolute';
        label.style.right = '5px';
        label.style.top = `${i}px`;
        label.style.transform = 'translateY(-50%)';
        label.textContent = `${i}`;
        labelContainer.appendChild(label);
    }

    return labelContainer;
};

export default coordinateLabels;
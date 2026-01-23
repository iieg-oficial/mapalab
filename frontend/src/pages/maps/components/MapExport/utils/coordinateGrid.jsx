import coordenadasIcon from '@assets/icons/ico_coordenadas_normal.svg';

const coordinateGrid = (width, height, divisionsX = 5, divisionsY = 4) => {
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = `${width}px`;
    container.style.height = `${height}px`;
    container.style.zIndex = '5';
    container.style.pointerEvents = 'none';

    const iconSize = 16;

    for (let i = 1; i < divisionsX; i++) {
        for (let j = 1; j < divisionsY; j++) {
            const x = (i / divisionsX) * width;
            const y = (j / divisionsY) * height;

            const icon = document.createElement('img');
            icon.src = coordenadasIcon;
            Object.assign(icon.style, {
                position: 'absolute',
                left: `${x - iconSize / 2}px`,
                top: `${y - iconSize / 2}px`,
                width: `${iconSize}px`,
                height: `${iconSize}px`,
                opacity: '0.6'
            });

            container.appendChild(icon);
        }
    }

    return container;
};

export default coordinateGrid;
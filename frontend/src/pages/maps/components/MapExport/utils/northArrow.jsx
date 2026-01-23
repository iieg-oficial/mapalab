import nIcon from '@assets/icons/ico_n.svg';

const northArrow = () => {
    const container = document.createElement('div');
    Object.assign(container.style, {
        position: 'absolute',
        top: '60px',
        right: '60px',
        zIndex: '1000'
    });

    const icon = document.createElement('img');
    icon.src = nIcon;
    Object.assign(icon.style, {
        width: '40px',
        height: 'auto'
    });

    container.appendChild(icon);

    return container;
};

export default northArrow;

const layoutHeader = (logoUrl) => {
    const header = document.createElement('div');
    header.style.position = 'absolute';
    header.style.top = '0';
    header.style.left = '0';
    header.style.right = '0';
    header.style.display = 'flex';
    header.style.justifyContent = 'space-between';
    header.style.alignItems = 'center';
    header.style.padding = '15px 20px';
    header.style.zIndex = '1000';

    const logo = document.createElement('img');
    logo.src = logoUrl;
    logo.style.width = '200px';
    logo.style.height = 'auto';
    logo.style.zIndex = '1000';
  
    const titleContainer = document.createElement('div');
    titleContainer.style.textAlign = 'center';
    titleContainer.style.flex = '1';

    const title = document.createElement('h2');
    title.textContent = 'Mapa Geográfico';
    title.style.margin = '0';
    title.style.fontSize = '30px';
    title.style.fontWeight = 'bold';
    title.style.color = '#ffffff';
    title.style.textShadow = '2px 2px 4px rgba(0, 0, 0, 0.8)';

    const date = document.createElement('p');
    date.textContent = new Date().toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    date.style.margin = '5px 0 0 0';
    date.style.fontSize = '22px';
    date.style.color = '#ffffff';
    date.style.textShadow = '1px 1px 3px rgba(0, 0, 0, 0.8)';

    titleContainer.appendChild(title);
    titleContainer.appendChild(date);

    const spacer = document.createElement('div');
    spacer.style.width = '120px';

    header.appendChild(logo);
    header.appendChild(titleContainer);
    header.appendChild(spacer);

    return header;
};

export default layoutHeader;
const handleShare = (setMessage) => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl)
        .then(() => {
            setMessage('¡Enlace copiado!');
        })
        .catch(() => {
            setMessage('Error al copiar');
        });
};

export default handleShare;
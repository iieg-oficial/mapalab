export const handleKeyActivate = (callback) => (e) => {
    if (!callback) return;
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        callback(e);
    }
};

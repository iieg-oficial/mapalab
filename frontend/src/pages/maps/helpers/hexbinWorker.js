let worker = null;

export const hexbinWorker = () => {
    if (typeof Worker === 'undefined') return null;
    worker ??= new Worker(new URL('./hexbin.worker.js', import.meta.url), { type: 'module' });
    return worker;
};

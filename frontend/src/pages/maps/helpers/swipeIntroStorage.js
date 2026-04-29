export const SWIPE_INTRO_DISMISSED_KEY = 'mapalab.swipe.intro_dismissed';

export const isSwipeIntroDismissed = () => {
    try {
        return localStorage.getItem(SWIPE_INTRO_DISMISSED_KEY) === 'true';
    } catch {
        return false;
    }
};

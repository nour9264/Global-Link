// Smooth scroll enhancement for better performance
export function initSmoothScroll() {
    const appContent = document.querySelector('.app-content');

    if (!appContent) return () => { };

    // Enhance scroll speed - multiply wheel delta for faster scrolling
    const handleWheel = (e) => {
        // Only apply if not already scrolling smoothly
        if (e.deltaY !== 0) {
            e.preventDefault();

            // Multiply scroll speed by 1.5 for faster scrolling
            const scrollAmount = e.deltaY * 1.5;

            appContent.scrollBy({
                top: scrollAmount,
                behavior: 'auto' // Use auto for instant response, CSS handles smoothness
            });
        }
    };

    // Add passive: false to allow preventDefault
    appContent.addEventListener('wheel', handleWheel, { passive: false });

    // Cleanup function
    return () => {
        appContent.removeEventListener('wheel', handleWheel);
    };
}

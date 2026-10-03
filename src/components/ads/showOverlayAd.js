// Overlay-β — только мобильная платформа (десктопная версия у Яндекса пока не
// вышла), не перекрывает контент целиком, поэтому не конкурирует с Floor Ad
// за экранное пространство. Частоту показа ограничивает сам блок в кабинете
// РСЯ — здесь просто дёргаем рендер, лишние вызовы Яндекс тихо игнорирует.
const BLOCK_ID = 'R-A-20141312-9';
const MOBILE_BREAKPOINT = 768;

export const showOverlayAd = () => {
    if (window.innerWidth >= MOBILE_BREAKPOINT) return;

    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(() => {
        if (window.Ya && window.Ya.Context && window.Ya.Context.AdvManager) {
            window.Ya.Context.AdvManager.render({
                blockId: BLOCK_ID,
                type: 'overlay',
                platform: 'touch',
            });
        }
    });
};

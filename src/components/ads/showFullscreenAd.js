// Полноэкранный блок не привязан к контейнеру на странице — Yandex сам рисует
// его поверх всего экрана, поэтому это просто функция-триггер, а не компонент.
// Десктоп и мобильный созданы в кабинете отдельными блоками с разным platform.
const DESKTOP_BLOCK_ID = 'R-A-20141312-7';
const MOBILE_BLOCK_ID = 'R-A-20141312-6';
const MOBILE_BREAKPOINT = 768;

// Частоту показа (не чаще раза в час и т.п.) Yandex ограничивает сам на
// стороне блока — здесь достаточно просто дёргать render на каждое действие,
// лишние вызовы Yandex тихо проигнорирует, если лимит ещё не истёк.
export const showFullscreenAd = () => {
    const isMobile = window.innerWidth < MOBILE_BREAKPOINT;

    window.yaContextCb = window.yaContextCb || [];
    window.yaContextCb.push(() => {
        if (window.Ya && window.Ya.Context && window.Ya.Context.AdvManager) {
            window.Ya.Context.AdvManager.render(
                isMobile
                    ? {blockId: MOBILE_BLOCK_ID, type: 'fullscreen', platform: 'touch'}
                    : {blockId: DESKTOP_BLOCK_ID, type: 'fullscreen', platform: 'desktop'}
            );
        }
    });
};

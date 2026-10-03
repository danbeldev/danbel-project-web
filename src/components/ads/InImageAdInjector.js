import {useEffect} from 'react';

const BLOCK_ID = 'R-A-20141312-8';

// Картинки, для которых уже запустили рендер рекламы — WeakSet сам "забывает"
// элементы после их удаления из DOM, отдельная чистка не нужна.
const processed = new WeakSet();

const renderForImage = (img) => {
    if (processed.has(img)) return;
    processed.add(img);

    img.id = img.id || `yandex_rtb_${BLOCK_ID}-${Math.random().toString(16).slice(2)}`;

    const doRender = () => {
        window.yaContextCb = window.yaContextCb || [];
        window.yaContextCb.push(() => {
            if (window.Ya && window.Ya.Context && window.Ya.Context.AdvManager) {
                window.Ya.Context.AdvManager.render({
                    renderTo: img.id,
                    blockId: BLOCK_ID,
                    type: 'inImage',
                });
            }
        });
    };

    if (img.tagName === 'IMG' && !img.complete) {
        img.addEventListener('load', doRender, {once: true});
    } else {
        doRender();
    }
};

const scan = () => document.querySelectorAll('img').forEach(renderForImage);

// Готовый код из кабинета РСЯ сканирует картинки один раз на window "load" —
// в SPA этого недостаточно: контент (например, обложка статьи) часто
// подгружается асинхронно уже ПОСЛЕ смены маршрута, с произвольной задержкой —
// фиксированный таймер после навигации то и дело промахивался мимо таких
// картинок. MutationObserver ловит их сразу, когда они реально появляются
// в DOM, независимо от того, когда именно это произошло.
const InImageAdInjector = () => {
    useEffect(() => {
        scan();

        const observer = new MutationObserver(scan);
        observer.observe(document.body, {childList: true, subtree: true});

        return () => observer.disconnect();
    }, []);

    return null;
};

export default InImageAdInjector;

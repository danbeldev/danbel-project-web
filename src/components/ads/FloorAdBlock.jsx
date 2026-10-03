import React, {useEffect, useState} from 'react';
import YandexAdBlock from './YandexAdBlock';

// Floor Ad создан в кабинете РСЯ отдельными блоками под десктоп и под мобильные
// (форма создания блока просит платформу на выбор, а не оба сразу) — здесь просто
// подставляем нужный id по ширине экрана.
const DESKTOP_BLOCK_ID = 'R-A-20141312-1';
const MOBILE_BLOCK_ID = 'R-A-20141312-2';
const MOBILE_BREAKPOINT = 768;

const FloorAdBlock = () => {
    const [isMobile, setIsMobile] = useState(window.innerWidth < MOBILE_BREAKPOINT);

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const blockId = isMobile ? MOBILE_BLOCK_ID : DESKTOP_BLOCK_ID;
    // key заставляет пересоздать компонент при смене платформы (например, при
    // повороте экрана) — иначе YandexAdBlock не подхватит новый blockId, так как
    // сам рендер запускается только один раз при монтировании.
    return <YandexAdBlock key={blockId} blockId={blockId}/>;
};

export default FloorAdBlock;

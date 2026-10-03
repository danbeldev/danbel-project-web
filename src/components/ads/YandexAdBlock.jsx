import React, {useEffect, useId, useRef} from 'react';
import {Box} from '@mui/material';

// Рендерит один рекламный блок РСЯ по его block-id. Контейнеру нужен уникальный
// DOM id на каждый монтированный экземпляр — иначе при нескольких блоках с
// одним и тем же blockId на странице (например, {{ad}} в нескольких статьях
// подряд) Yandex.Context не сможет понять, в какой контейнер рендерить какой.
const YandexAdBlock = ({blockId, minHeight = 100, type}) => {
    const containerId = `yandex_rtb_${blockId}_${useId().replace(/:/g, '')}`;
    const rendered = useRef(false);

    useEffect(() => {
        if (rendered.current) return;
        rendered.current = true;

        window.yaContextCb = window.yaContextCb || [];
        window.yaContextCb.push(() => {
            if (window.Ya && window.Ya.Context && window.Ya.Context.AdvManager) {
                window.Ya.Context.AdvManager.render({
                    blockId,
                    renderTo: containerId,
                    // Блоки типа "Лента" требуют явный type: "feed" в конфиге
                    // render — без него Yandex.Context отвечает
                    // RESPONSE_MISMATCH_BANNER_CFG и ничего не рендерит.
                    ...(type ? {type} : {}),
                });
            }
        });
    }, [blockId, containerId, type]);

    return <Box id={containerId} sx={{minHeight, width: '100%'}}/>;
};

export default YandexAdBlock;

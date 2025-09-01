import { useEffect } from "react";

const YandexBannerAd = () => {
    useEffect(() => {
        if (window.yaContextCb) {
            window.yaContextCb.push(() => {
                window.Ya.Context.AdvManager.render({
                    "blockId": "R-A-16971244-1",
                    "renderTo": "yandex_rtb_R-A-16971244-1"
                });
            });
        }
    }, []);

    return <div id="yandex_rtb_R-A-16971244-1"/>;
};

export const YandexTapeAd = () => {
    useEffect(() => {
        if (window.yaContextCb) {
            window.yaContextCb.push(() => {
                window.Ya.Context.AdvManager.render({
                    "blockId": "R-A-16971244-2",
                    "renderTo": "yandex_rtb_R-A-16971244-2",
                    "type": "feed"
                })
            })
        }
    }, []);

    return <div id="yandex_rtb_R-A-16971244-2"/>;
}

export const YandexBottomAd = () => {
    useEffect(() => {
        if (window.yaContextCb) {
            window.yaContextCb.push(() => {
                window.Ya.Context.AdvManager.render({
                    "blockId": "R-A-16971244-4",
                    "type": "floorAd",
                    "platform": "touch"
                })
            })
        }
    }, []);

    return <></>
}

export default YandexBannerAd;


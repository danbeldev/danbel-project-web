import { useEffect } from "react";

const YandexBannerAd = () => {
    useEffect(() => {
        if (window.yaContextCb) {
            window.yaContextCb.push(() => {
                window.Ya.Context.AdvManager.render({
                    blockId: "R-A-16645456-1", // ⚡️ твой ID блока
                    renderTo: "yandex_rtb_R-A-16645456-1",
                });
            });
        }
    }, []);

    return <div id="yandex_rtb_R-A-16645456-1"/>;
};

export const YandexTapeAd = () => {
    useEffect(() => {
        if (window.yaContextCb) {
            window.yaContextCb.push(() => {
                window.Ya.Context.AdvManager.render({
                    "blockId": "R-A-16645456-2",
                    "renderTo": "yandex_rtb_R-A-16645456-2",
                    "type": "feed"
                })
            })
        }
    }, []);

    return <div id="yandex_rtb_R-A-16645456-2"/>;
}

export const YandexBottomAd = () => {
    useEffect(() => {
        if (window.yaContextCb) {
            window.yaContextCb.push(() => {
                window.Ya.Context.AdvManager.render({
                    "blockId": "R-A-16645456-3",
                    "type": "floorAd",
                    "platform": "touch"
                })
            })
        }
    }, []);

    return <></>
}

export default YandexBannerAd;


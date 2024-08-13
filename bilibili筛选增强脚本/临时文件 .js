if (storedData && Math.abs(storedData.view - prePlayCount) / storedData.view < 0.05) {
    console.log(`从LocalStorage中获取视频信息: ${storedData.title}`);
    return storedData;
    if (storedData) console.log(`播放量变动超过5%,重新获取数据:${storedData.title}`);
}
------------------------------------------------------------------------------------------

    let
isMainRunning = false; // 标志位，表示 `main` 函数是否正在执行
let throttleTimeout; // 用于节流的超时标志

const observer = new MutationObserver(() => {
    if (document.visibilityState === "visible" && document.readyState === "complete") { // 排除页面切走时的刷新情况,检查页面是否已经完全加载完成
        if (!isMainRunning) { // 如果 `main` 函数没有正在执行
            clearTimeout(throttleTimeout); // 清除之前的超时
            throttleTimeout = setTimeout(async () => {
                isMainRunning = true; // 设置标志位，表示 `main` 函数正在执行
                observer.disconnect(); // 暂停监视器
                await main();
                observer.observe(document.body, {childList: true, subtree: true}); // 重新启动监视器
                isMainRunning = false; // `main` 函数执行完成，重置标志位
            }, 500); // 设定节流时间为500ms，可以根据实际情况调整
        }
    }
});

删除main部分的observer
----------------------------------------------------------------------------------------

    下一页
按钮
#i_cecream > div > div
:
nth - child(2) > div.search - content--
gray.search - content > div > div > div > div.flex_center.mt_x50.mb_x50 > div > div > button
:
nth - child(11)
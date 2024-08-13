// ==UserScript==
// @name         bilibili加载下一页card函数
// @version      0.7
// @description  使用预筛选结果进行进一步筛选和排序。
// @match        https://search.bilibili.com/*
// @icon         https://www.bilibili.com/favicon.ico?v=1
// ==/UserScript==

;(function () {
    'use strict'

    function loadNextPage() {
        // 使用类名和文本内容定位“下一页”按钮
        const buttons = document.querySelectorAll('button.vui_button.vui_pagenation--btn.vui_pagenation--btn-side');
        let nextPageButton = null;

        buttons.forEach(button => {
            if (button.innerText.includes('下一页')) {
                nextPageButton = button;
            }
        });

        if (nextPageButton) {
            console.log('找到“下一页”按钮');

            // 检查“下一页”按钮是否可用
            if (!nextPageButton.disabled) {
                console.log('“下一页”按钮未禁用');

                // 模拟点击“下一页”按钮以加载下一页内容
                nextPageButton.click();
                console.log('点击了“下一页”按钮');

                // 使用MutationObserver来监听新内容的加载
                const container = document.evaluate('//*[@id="i_cecream"]/div/div[2]/div[2]/div/div/div/div[2]/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                const pageObserver = new MutationObserver((mutationsList, observer) => {
                    for (let mutation of mutationsList) {
                        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                            console.log('检测到新内容加载');

                            // 过滤出新加载的卡片元素
                            const newVideos = Array.from(mutation.addedNodes).filter(node => node.nodeType === 1);

                            // 将新加载的视频卡片追加到现有页面的底端
                            newVideos.forEach(video => {
                                const newCard = video.cloneNode(true); // 深度克隆新的视频卡片
                                container.appendChild(newCard);
                                console.log('添加视频卡片: ' + (newCard.querySelector('.title') ? newCard.querySelector('.title').innerText : '未命名'));
                            });

                            // 停止观察，防止重复触发
                            observer.disconnect();
                        }
                    }
                });

                // 开始观察视频容器的变化
                pageObserver.observe(container, { childList: true });

            } else {
                console.error('“下一页”按钮已禁用');
            }

        } else {
            console.error('“下一页”按钮未找到');
        }
    }

    // 在页面加载完成后的第三秒执行loadNextPage函数
    window.addEventListener('load', function() {
        setTimeout(loadNextPage, 3000);
    });

})();

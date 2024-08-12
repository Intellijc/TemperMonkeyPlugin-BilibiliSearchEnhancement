// ==UserScript==
// @name         整合 展开时间筛选 和 进一步筛选组件
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  在Bilibili搜索结果页添加发布时间筛选、进一步筛选和排序功能
// @author       YouIntellijc
// @match        *://search.bilibili.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bilibili.com
// @grant        none
// ==/UserScript==


(function() {
    'use strict';

    // --- 模拟数据 ---
    let excludeUids = [];
    let minDanmaku = 5;
    let minPlayCount = 2000;
    let dateStart = '2020-01-01';
    let dateEnd = '2024-08-06';
    let likeViewRatio = 0.01; // 赞播比
    let favoriteViewRatio = 0.0075; // 藏播比
    let coinViewRatio = 0.0045; // 币播比
    const params = { a: 0.4, b: 1.5, c: 0.3, d: 0.2, e: 0.1, f: 0.05, g: 0.1, k1: 10, k2: 100 };

    //  展示弹窗工具
    function showMessage(message, duration = 1200) {
        const div = document.createElement('div');
        div.textContent = message;
        div.style.cssText = `
            position: fixed;
            top: 5%;
            left: 50%;
            transform: translateX(-50%);
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 9999;
        `;
        document.body.appendChild(div);

        setTimeout(() => {
            div.remove();
        }, duration);
    }

    // 等待元素出现 (未使用, 预留)
    /*function waitForElement(xpath, callback) {
        const observer = new MutationObserver(() => {
            const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (element) {
                callback(element);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }*/

    // ----------------------------------------------------------------------------- 添加发布时间筛选器 -----------------------------------------------------------------------------

    // 添加 "发布时间" 按钮和选项
    function addPublishTimeFilter(container) {
        // 检查“发布时间”过滤器是否已添加
        if (document.querySelector('.publish-time-filter')) return;

        // 创建“发布时间”按钮容器
        const publishTimeContainer = document.createElement('div');
        publishTimeContainer.className = 'filter-item publish-time-filter';
        publishTimeContainer.style.marginLeft = '10px';
        publishTimeContainer.style.display = 'flex';
        publishTimeContainer.style.flexWrap = 'wrap';
        publishTimeContainer.style.gap = '10px';
        publishTimeContainer.style.userSelect = 'none'; // 外部不可选中

        // 创建按钮列表
        const buttons = [
            { id: 'all-dates', text: '全部日期' },
            { id: 'three-years', text: '三年内' },
            { id: 'one-year', text: '一年内' },
            { id: 'three-months', text: '三月内' },
            { id: 'one-month', text: '一月内' },
            { id: 'three-days', text: '三天内' },
            { id: 'one-day', text: '一天内' },
            { id: 'custom-start', text: '自定义起始日期' },
            { id: 'custom-end', text: '自定义结束日期' },
            { id: 'confirm-dates', text: '确定日期' }
        ];

        // 在脚本开头部分添加样式
        const style = document.createElement('style');
        style.textContent = `
.publish-time-filter .vui_button--tab {
    display: inline-block;
    height: 32px;
    padding: 0 15px;
    font-size: 14px;
    line-height: 32px; /* 使文字垂直居中 */
    text-align: center; /* 使文字水平居中 */
    color: rgb(97, 102, 109); /* 默认文本颜色 */
    border-radius: 8px; /* 圆角矩形 */
    background: none; /* 无背景 */
    cursor: pointer; /* 鼠标指针样式 */
    user-select: none; /* 阻止按钮文字被选中 */
    box-sizing: border-box; /* 确保边框和内边距不会影响元素的总宽高 */
}

.publish-time-filter .vui_button--tab:hover {
    color: var(--v_brand_blue); /* 悬浮时文本颜色 */
}

.publish-time-filter .vui_button--tab.vui_button--active, .publish-time-filter .vui_button--tab.vui_button--active:hover {
    color: var(--v_brand_blue); /* 被选中时文本颜色 */
    background: var(--v_brand_blue_thin); /* 被选中时背景颜色 */
    border: none; /* 移除边框 */
}

`;
        document.head.appendChild(style);

        // 修改添加按钮的部分
        buttons.forEach(buttonInfo => {
            const button = document.createElement('div');
            button.className = 'vui_button--tab'; // 添加B站的按钮样式类
            button.id = buttonInfo.id;
            button.innerText = buttonInfo.text;
            button.style.textAlign = 'center'; // 使文字水平居中
            button.style.marginTop = '10px'; // 上方10px间距
            button.style.marginRight = '10px'; // 右侧10px间距


            // 如果是 "全部日期" 按钮，设置为默认选中状态
            if (buttonInfo.id === 'all-dates') {button.classList.add('vui_button--active');}

            // 添加点击事件监听器
            button.addEventListener('click', function () {

                publishTimeContainer.querySelectorAll('.vui_button--tab').forEach(btn => { btn.classList.remove('vui_button--active'); });// 移除时间按钮的选中状态
                button.classList.add('vui_button--active');// 添加当前按钮的选中状态

                if (buttonInfo.id === 'custom-start' || buttonInfo.id === 'custom-end') {
                    const dateInput = document.createElement('input');
                    dateInput.type = 'date';
                    dateInput.style.position = 'absolute';
                    dateInput.style.zIndex = '1001';
                    dateInput.style.left = button.getBoundingClientRect().left + 'px'; // 固定位置
                    dateInput.style.top = button.getBoundingClientRect().bottom + 5 + 'px'; // 固定位置

                    // 设置日期选择器的最小值和最大值
                    dateInput.setAttribute('min', '2009-01-01');
                    dateInput.setAttribute('max', new Date().toISOString().split('T')[0]);
                    document.body.appendChild(dateInput);

                    dateInput.addEventListener('change', function () {
                        if (buttonInfo.id === 'custom-start') {startDateInput.value = dateInput.value;} // 显示选定的日期在文本框中
                        else {endDateInput.value = dateInput.value;} // 显示选定的日期在文本框中
                    });

                    dateInput.addEventListener('blur', function () {
                        if (document.body.contains(dateInput)) {document.body.removeChild(dateInput);}});// 在失焦时退出日期选择器
                    dateInput.focus();
                    dateInput.showPicker(); // 显示日期选择器
                }
                else {
                    console.log(buttonInfo.text + ' clicked');
                    // 添加自定义逻辑
                }
            });
            publishTimeContainer.appendChild(button);
        });

        publishTimeContainer.style.marginLeft = '0'; // 左侧没有间距todo:这句话有必要吗?


        // 将按钮容器添加到筛选容器中
        container.appendChild(publishTimeContainer);

        // 在自定义起始日期按钮之后添加文本框
        const customStartButton = publishTimeContainer.querySelector('#custom-start');
        const startDateInput = document.createElement('input');
        startDateInput.type = 'text';
        startDateInput.placeholder = 'YYYY-MM-DD';
        startDateInput.style.padding = '5px';
        startDateInput.style.border = '1px solid #ddd';
        startDateInput.style.borderRadius = '8px';
        startDateInput.style.marginTop = '10px'; // 上方10px间距
        startDateInput.style.marginRight = '10px'; // 右侧10px间距
        customStartButton.after(startDateInput);

        // 在自定义结束日期按钮之后添加文本框
        const customEndButton = publishTimeContainer.querySelector('#custom-end');
        const endDateInput = document.createElement('input');
        endDateInput.type = 'text';
        endDateInput.placeholder = 'YYYY-MM-DD';
        endDateInput.style.padding = '5px';
        endDateInput.style.border = '1px solid #ddd';
        endDateInput.style.borderRadius = '8px';
        endDateInput.style.marginTop = '10px'; // 上方10px间距
        endDateInput.marginRight = '10px'; // 右侧10px间距
        customEndButton.after(endDateInput);

        // 在“确定选择日期”按钮的点击事件中返回起始和结束日期
        const confirmButton = publishTimeContainer.querySelector('#confirm-dates');
        confirmButton.addEventListener('click', function () {
            const today = new Date().toISOString().split('T')[0];
            let startDate = startDateInput.value || '2009-01-01'; // 如果为空，设置最小值
            let endDate = endDateInput.value || today; // 如果为空，设置为当天日期

            // 额外的日期条件处理
            if (new Date(startDate) < new Date('2009-01-01')) { startDate = '2009-01-01'; }
            if (new Date(endDate) < new Date('2009-01-01')) { endDate = '2009-01-01'; }
            if (new Date(startDate) > new Date(today)) { startDate = today; }
            if (new Date(endDate) > new Date(today)) { endDate = today; }
            if (new Date(startDate) > new Date(endDate)) { showMessage('起始日期不能大于结束日期');startDateInput.value = '';endDateInput.value = ''; return; }

            startDateInput.value = startDate; endDateInput.value = endDate;

            console.log('确定选择的起始日期: ' + startDate);
            console.log('确定选择的结束日期: ' + endDate);
            // 在此添加自定义逻辑，例如提交日期范围进行筛选
        });
    }


    // ------------------------------------------------ 预筛选函数 -----------------------------------------------------------------------------
    function filterAndExcludeByDate(cardList, excludeUids, minDanmaku, minPlayCount, dateStart, dateEnd) {
        let preInfoAndCard = [];
        console.log('初步筛选开始');

        // 遍历所有card，提取信息
        cardList.forEach(card => {

            // 如果URL包含 '/cheese/play/'说明是bili课堂，跳过该卡片
            if (card.querySelector('a').href.includes('/cheese/play/')) {
                console.log('跳过课堂卡片:', card.querySelector('.bili-video-card__info--tit').textContent.trim());
                return;
            }
            // 如果URL包含'/live.bilibili.com'说明是bili直播,跳过该卡片
            if (card.querySelector('a').href.includes('/live.bilibili.com/')) {
                console.log('跳过直播卡片:', card.querySelector('.bili-video-card__info--tit').textContent.trim());
                return;
            }
            // 如果 card没有bili-video-card__info--owner属性, 说明是搜up得来的视频,跳过该卡片 todo:获取up信息并收录该卡片
            if (!card.querySelector('.bili-video-card__info--owner')) {
                console.log('跳过up主介绍卡片:', card.querySelector('.bili-video-card__info--tit').textContent.trim());
                return;
            }

            let preUpUid = card.querySelector('.bili-video-card__info--owner').getAttribute('href').split('/').pop();
            let preBvId = card.querySelector('.bili-video-card__info--right a[href^="//www.bilibili.com/video/BV"]').getAttribute('href').match(/\/BV[\w]+\//)[0].replace(/\//g, '');
            let preDanmaku = parseInt(card.querySelector('.bili-video-card__stats--item:nth-child(2) span').textContent);
            let prePlayCountText = card.querySelector('.bili-video-card__stats--item:nth-child(1) span').textContent.trim();
            let prePlayCount;//如果包含万 ,去万乘10000
            if (prePlayCountText.includes('万')) {
                prePlayCount = parseFloat(prePlayCountText.replace('万', '')) * 10000;
            } else {
                prePlayCount = parseInt(prePlayCountText);
            }

            let preDuration = card.querySelector('.bili-video-card__stats__duration').textContent;
            let prePublishDate = card.querySelector('.bili-video-card__info--date').textContent.replace('·', '').trim();
            let preVideoName = card.querySelector('.bili-video-card__info--tit').textContent.trim();

            preInfoAndCard.push({
                preUpUid,
                preBvId,
                preDanmaku,
                prePlayCount,
                preDuration,
                prePublishDate,
                preVideoName,
                card
            });
            console.log('获取到card:', preUpUid, preBvId, preDanmaku, prePlayCount, preDuration, prePublishDate, preVideoName);
        });
        console.log('获取到preInfoAndCard:', preInfoAndCard);

        // 返回预筛选后的BV号列表
        return preInfoAndCard.filter(video => {
            // 排除指定UP主
            if (excludeUids.includes(video.preUpUid)) {
                console.log('up主在黑名单,排除《' + video.preVideoName + '》');
                return false;
            }

            // 检查弹幕数
            if (video.preDanmaku < minDanmaku) {
                console.log('弹幕数量=' + video.preDanmaku + ',排除《' + video.preVideoName + '》');
                return false;
            }

            // 检查播放量
            if (video.prePlayCount < minPlayCount) {
                console.log('播放量=' + video.prePlayCount + ',排除《' + video.preVideoName + '》');
                return false;
            }

            // 检查发布日期
            let start = new Date(dateStart);
            let end = new Date(dateEnd);
            if (Date(video.prePublishDate) < start || Date(video.prePublishDate) > end) {
                console.log('发布日期不在范围内,排除《' + video.preVideoName + '》');
                return false;
            }

            return true;
        });
    }

    // ----------------------------------------------------------------------------- 视频信息处理和筛选 -----------------------------------------------------------------------------
    async function fetchVideoInfo(bvId, prePlayCount, prePublishDate) {
        let videoOrder = JSON.parse(localStorage.getItem('videoOrder')) || [];// 获取存储的视频顺序列表
        const storedData = JSON.parse(localStorage.getItem(bvId));

        if (storedData && Math.abs(storedData.view - prePlayCount) / storedData.view < 0.05) {
            console.log(`从LocalStorage中获取视频信息: ${storedData.title}`);
            return storedData;
            if (storedData)console.log(`播放量变动超过5%,重新获取数据:${storedData.title}`);
        }

        const response = await fetch('https://api.bilibili.com/x/web-interface/view?bvid=' + bvId);
        const data = await response.json();

        if (data.code === 0) {
            const videoData = data.data;
            const videoInfo = {
                bvid: videoData.bvid, // 视频的BV号
                title: videoData.title, // 视频标题
                pubdate: prePublishDate, // 发布日期
                duration: videoData.duration, // 视频时长，单位为秒
                view: prePlayCount, // 原始播放量
                danmaku: videoData.stat.danmaku, // 弹幕数量
                reply: videoData.stat.reply, // 评论数量
                favorite: videoData.stat.favorite, // 收藏数量
                coin: videoData.stat.coin, // 硬币数量
                share: videoData.stat.share, // 分享数量
                like: videoData.stat.like, // 点赞数量
                upid: videoData.owner.mid, // UP主的用户ID
                upname: videoData.owner.name, // UP主昵称
            };

            //存储新的视频信息到localstorage
            localStorage.setItem(bvId, JSON.stringify(videoInfo));
            console.log('从API中获取视频信息: ' + videoInfo.title);

            // 更新视频顺序列表
            videoOrder.push(bvId);
            if (videoOrder.length > 15000) {
                const itemsToRemove = videoOrder.splice(0, 2000);// 如果记录数量超过 15000 个，删除最早添加的 2000 个记录
                itemsToRemove.forEach(item => localStorage.removeItem(item));
            }
            // 更新视频顺序列表到 localStorage
            localStorage.setItem('videoOrder', JSON.stringify(videoOrder));

            return videoInfo;
        } else {
            console.error('从API获取视频详细信息失败: ' + data.message);
            return null;
        }
    }

    async function getVideoDetailsArray(preFilteredInfoAndCardList) {
        let videoDetailsArray = [];
        for (const preFilteredInfoAndCard of preFilteredInfoAndCardList) {

            let bvId = preFilteredInfoAndCard.preBvId;//预先获取详细信息中不好获取的
            let prePlayCount = preFilteredInfoAndCard.prePlayCount;
            let prePublishDate = preFilteredInfoAndCard.prePublishDate;

            const videoData = await fetchVideoInfo(bvId, prePlayCount, prePublishDate);
            if (videoData) {
                // 将获取到的视频信息添加到数组中
                videoDetailsArray.push({
                    ...videoData,
                    pubdate: preFilteredInfoAndCard.prePublishDate, // 保持原来的发布日期
                    card: preFilteredInfoAndCard.card // 原始卡片元素
                });
            }
        }
        console.log('视频详细信息数组:', videoDetailsArray);
        return videoDetailsArray;
    }


    function furtherFilterVideos(videoDetailsArray, likeViewRatio, favoriteViewRatio, coinViewRatio) {
        console.log('进一步筛选视频');
        return videoDetailsArray.filter(video => {
            const likeViewRatioActual = video.like / video.view;
            const favoriteViewRatioActual = video.favorite / video.view;
            const coinViewRatioActual = video.coin / video.view;
            if (likeViewRatioActual < likeViewRatio) {
                console.log('点赞播放比= ' + likeViewRatioActual + ', 排除视频《' + video.title + '》');
                return false;
            }
            if (favoriteViewRatioActual < favoriteViewRatio) {
                console.log('收藏播放比= ' + favoriteViewRatioActual + ', 排除视频《' + video.title + '》');
                return false;
            }
            if (coinViewRatioActual < coinViewRatio) {
                console.log('投币播放比= ' + coinViewRatioActual + ', 排除视频《' + video.title + '》');
                return false;
            }
            return true;
        });
    }


    function sortVideos(videoDetailsArray, params) {
        console.log('开始排序视频');
        // 计算得分
        const sortedVideos = videoDetailsArray.map(video => {
            const view = video.view + params.k1;
            const score =
                  params.a * (video.like / Math.pow(view, params.b)) +
                  params.c * (video.favorite / Math.pow(view, params.b)) +
                  params.d * (video.coin / Math.pow(view, params.b)) +
                  params.e * (video.reply / (video.view + params.k2)) +
                  params.f * video.duration +
                  params.g * video.share;
            return { video, score };
        });

        sortedVideos.sort((a, b) => b.score - a.score);// 排序

        // 输出排序结果
        sortedVideos.forEach(item => {
            console.log('得分: ' + item.score + ', 视频名称:' + item.video.title);
        });
        console.log('打分完成!');

        return sortedVideos.map(item => item.video);
    }


    function reorderVideos(sortedArray) {

        const container = document.evaluate('//*[@id="i_cecream"]/div/div[2]/div[2]/div/div/div/div[2]/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

        // 删除除了sortedArray.length个视频卡片之外的所有视频卡片及其父元素
        while (container.children.length > sortedArray.length) {
            container.removeChild(container.lastChild);
        }

        // 重新写回视频元素
        for (let i = 0; i < sortedArray.length; i++) {
            container.children[i].innerHTML = '';// 删除原有的card
            container.children[i].appendChild(sortedArray[i].card);// 添加新的card
            console.log('写入第' + (i + 1) + '个视频卡片:' + sortedArray[i].title);
        }
        console.log('全部视频排序完成!')
    }

    // ----------------------------------------------------------------------------- 主函数 -----------------------------------------------------------------------------
    async function main() {

        //获取视频card数据
        //let cardList = Array.from(document.querySelectorAll('.bili-video-card')).slice(0, 10);//todo 待添加翻页填满功能(不着急)
        let cardList = document.querySelectorAll('.bili-video-card');
        console.log('视频card数据获取成功:', cardList);

        // 删除所有包含 "live-from" 属性的元素 (up卡片, 赛事, 活动, 番剧, 纪录片, 电影)
        let unwantedElements = document.querySelectorAll('[live-from]:not(.brand-ad-list)');
        unwantedElements.forEach(element => element.remove());


        //预筛选视频卡片
        let preFilteredCardList = filterAndExcludeByDate(cardList, excludeUids, minDanmaku, minPlayCount, dateStart, dateEnd)

        // 获取所有视频的详细信息
        let videoDetailsArray = await getVideoDetailsArray(preFilteredCardList);

        // 进一步筛选
        let furtherFilteredVideos = furtherFilterVideos(videoDetailsArray, likeViewRatio, favoriteViewRatio, coinViewRatio);
        console.log('进一步筛选后的视频:', furtherFilteredVideos);

        // 排序
        let sortedVideos = sortVideos(furtherFilteredVideos, params);

        // 视频按序写回页面
        await reorderVideos(sortedVideos);
    }


    // ----------------------------------------------------------------------------- 初始化和事件监听 -----------------------------------------------------------------------------
    // 当页面元素发生变化时，暂停0.5秒再调用主函数
    let isMainRunning = false; // 标志位，表示 `main` 函数是否正在执行
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

    // 等待页面加载完成执行主函数
    window.addEventListener('load', function () {
        console.log('页面加载完成, 等待0.5秒后执行脚本');
        setTimeout(async () => {
            observer.observe(document.body, { childList: true, subtree: true, });// 初始化 Observer
            await main();
        }, 500); // 等待0.5秒
    });


    // 处理 "更多筛选" 按钮点击事件
    function handleMoreFilterButtonClick() {
        const moreFilterButtonXPath = '//*[@id="i_cecream"]/div/div[2]/div[1]/div[3]/div/div[1]/button';
        const filterMenuXPath = '//*[@id="i_cecream"]/div/div[2]/div[1]/div[3]/div/div[2]';
        const moreFilterButton = document.evaluate(moreFilterButtonXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (moreFilterButton) {
            moreFilterButton.addEventListener('click', function () {
                console.log("更多筛选被点击");
                const filterMenu = document.evaluate(filterMenuXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (filterMenu) {
                    // 在此处调用 addPublishTimeFilter 函数
                    addPublishTimeFilter(filterMenu);
                }
            });
        }
    }

    // 初始化脚本
    handleMoreFilterButtonClick();
    // 获取视频顺序列表，如果不存在则初始化为空数组
    let videoOrder = JSON.parse(localStorage.getItem('videoOrder')) || [];
    // 添加样式表
    const styles = `.filter-item {margin-bottom: 10px;}`;
    const styleSheet = document.createElement("style");
    styleSheet.type = "text/css";
    styleSheet.innerText = styles;
    document.head.appendChild(styleSheet);
    console.log('初始化完成!');
})();
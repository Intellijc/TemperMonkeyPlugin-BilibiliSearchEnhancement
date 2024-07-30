// ==UserScript==
// @name         投币播放比排序
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Sort Bilibili search results by coin/view ratio
// @match        https://search.bilibili.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    console.log('b站投币播放比脚本开始执行');

    // 等待页面加载完成
    window.addEventListener('load', function() {
        console.log('页面加载完成,等待1秒后执行排序脚本');
        setTimeout(processSearchResults, 1000);  // 等待1秒
    });

    async function processSearchResults() {
        console.log('处理搜索结果...');
        // 获取视频列表
        const videoItems = document.querySelectorAll('.bili-video-card');
        console.log(`找到 ${videoItems.length} 个视频`);
        // 存储视频信息的数组
        let videoInfoArray = [];
        // 遍历视频项并获取信息
        for (let item of videoItems) {
            const videoInfo = await getVideoInfo(item);
            if (videoInfo) {
                videoInfoArray.push(videoInfo);
            }
        }
        console.log('获取视频信息完成');
        console.log(`成功获取到 ${videoInfoArray.length} 个视频的信息`);
        // 根据比率排序
        videoInfoArray.sort((a, b) => b.ratio - a.ratio);
        console.log('排序后的视频顺序:', videoInfoArray);
        // 重新排序DOM元素
        reorderVideos(videoInfoArray);
        console.log('重新排序完成');
    }

    async function getVideoInfo(item) {
        let linkElement = item.querySelector('.bili-video-card__wrap a');
        if (!linkElement) {
            console.log('找不到视频链接元素', item.outerHTML);
            return null;
        }
        const videoUrl = linkElement.href;
        if (!videoUrl) {
            console.log('找不到视频 URL', linkElement);
            return null;
        }
        const bvid = videoUrl.split('/').pop().split('?')[0]; // 获取BV号
        console.log(`正在获取 ${bvid} 视频的信息`);

        try {
            const response = await fetch(`https://api.bilibili.com/x/web-interface/archive/stat?bvid=${bvid}`);
            const data = await response.json();
            if (data.code === 0) {
                const viewCount = data.data.view;
                const coinCount = data.data.coin;
                const ratio = coinCount / viewCount;
                console.log(`视频BV号: ${bvid}: 播放=${viewCount}, 投币=${coinCount}, 币播比=${ratio}`);
                return {
                    element: item,
                    ratio: ratio,
                    bvid: bvid
                };
            } else {
                console.log(`API 返回错误码: ${data.code}, 消息: ${data.message}`);
            }
        } catch (error) {
            console.error(`获取 ${bvid} 信息失败:`, error);
        }
        return null;
    }

    function reorderVideos(sortedArray) {
        const container = document.querySelector('.video-list');
        if (!container) {
            console.log('找不到视频列表容器');
            return;
        }
        sortedArray.forEach(info => {
            container.appendChild(info.element);
        });
    }
})();
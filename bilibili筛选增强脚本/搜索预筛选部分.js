// ==UserScript==
// @name         Bilibili预筛选组件
// @version 0.5
// @description  Bilibili搜索页面筛选增强脚本，增加今年、本月、当日发布筛选，可配合B站原有的综合排序、最多点击、最多弹幕、最多收藏使用。
// @match        https://search.bilibili.com/*
// @icon         https://www.bilibili.com/favicon.ico?v=1
// ==/UserScript==

;(function () {
    'use strict'

    function filterAndExcludeByDate(cardList, excludeUids, minDanmaku, minPlayCount, dateStart, dateEnd) {
        let videoInfoArray = [];
        console.log('初步筛选开始');

        // 遍历所有card，提取信息
        cardList.forEach(card => {

            // 如果URL包含 '/cheese/play/'说明是bili课堂，跳过该卡片
            if (card.querySelector('a').href.includes('/cheese/play/')) { console.log('跳过课堂卡片:', card.querySelector('.bili-video-card__info--tit').textContent.trim()); return;}

            let upUid = card.querySelector('.bili-video-card__info--owner').getAttribute('href').split('/').pop();
            let bvId = card.querySelector('.bili-video-card__info--right a[href^="//www.bilibili.com/video/BV"]').getAttribute('href').match(/\/BV[\w]+\//)[0].replace(/\//g, '');
            let danmakuCount = parseInt(card.querySelector('.bili-video-card__stats--item:nth-child(2) span').textContent);
            let playCountText = card.querySelector('.bili-video-card__stats--item:nth-child(1) span').textContent.trim();
            let playCount;//如果包含万 ,去万乘10000
            if (playCountText.includes('万')) { playCount = parseFloat(playCountText.replace('万', '')) * 10000; }
            else { playCount = parseInt(playCountText); }

            let duration = card.querySelector('.bili-video-card__stats__duration').textContent;
            let publishDate = card.querySelector('.bili-video-card__info--date').textContent.replace('·', '').trim();
            let videoName = card.querySelector('.bili-video-card__info--tit').textContent.trim();

            videoInfoArray.push({
                upUid,
                bvId,
                danmakuCount,
                playCount,
                duration,
                publishDate,
                videoName
            });
            console.log('获取到card:',upUid,bvId,danmakuCount,playCount,duration, publishDate,videoName);
        });
        console.log('获取到videoInfoArray:', videoInfoArray);

        // 筛选视频
        let filteredVideos = videoInfoArray.filter(video => {
            // 排除指定UP主
            if (excludeUids.includes(video.upUid)) { console.log(`up主在黑名单,排除《${video.videoName}》`); return false; }

            // 检查弹幕数
            if (video.danmakuCount < minDanmaku ) { console.log(`弹幕数量=${video.danmakuCount},排除《${video.videoName}》`); return false; }

            // 检查播放量
            if (video.playCount < minPlayCount) { console.log(`播放量=${video.playCount},排除《${video.videoName}》`); return false; }

            // 检查发布日期
            let start = new Date(dateStart);
            let end = new Date(dateEnd);
            if (Date(video.publishDate) < start || Date(video.publishDate) > end) { console.log(`发布日期不在范围内,排除《${video.videoName}》`); return false; }

            return true;
        });

        // 返回筛选后的BV号列表
        return filteredVideos.map(video => video.bvId);
    }

    // 假设参数
    let cardList = document.querySelectorAll('.bili-video-card');
    let excludeUids = [];
    let minDanmaku = 5;
    let minPlayCount = 100;
    let dateStart = '2020-01-01';
    let dateEnd = '2024-07-31';

    // 执行筛选
    let filteredBvList = filterAndExcludeByDate(cardList, excludeUids, minDanmaku, minPlayCount, dateStart, dateEnd);

    // 输出结果到控制台
    console.log('初步筛选后的视频列表:', filteredBvList);
})();
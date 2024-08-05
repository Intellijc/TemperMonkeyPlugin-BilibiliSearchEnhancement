// ==UserScript==
// @name         Bilibili进一步筛选和排序组件
// @version      1.0
// @description  使用预筛选结果进行进一步筛选和排序。
// @match        https://search.bilibili.com/*
// @icon         https://www.bilibili.com/favicon.ico?v=1
// ==/UserScript==

; (function () {
    'use strict'

    //---------------------------------------------------------预筛选------------------------------------------------

        function filterAndExcludeByDate(cardList, excludeUids, minDanmaku, minPlayCount, dateStart, dateEnd) {
        let preInfoAndCard = [];
        console.log('初步筛选开始');

        // 遍历所有card，提取信息
        cardList.forEach(card => {

            // 如果URL包含 '/cheese/play/'说明是bili课堂，跳过该卡片
            if (card.querySelector('a').href.includes('/cheese/play/')) { console.log('跳过课堂卡片:', card.querySelector('.bili-video-card__info--tit').textContent.trim()); return;}
            // 如果URL包含'/live.bilibili.com'说明是bili直播,跳过该卡片
            if (card.querySelector('a').href.includes('/live.bilibili.com/')) {console.log('跳过直播卡片:', card.querySelector('.bili-video-card__info--tit').textContent.trim());return;}
            // 如果 card没有bili-video-card__info--owner属性, 说明是搜up得来的视频,跳过该卡片 todo:获取up信息并收录该卡片
            if (!card.querySelector('.bili-video-card__info--owner')){console.log('跳过up主介绍卡片:', card.querySelector('.bili-video-card__info--tit').textContent.trim());return;}

            let preUpUid = card.querySelector('.bili-video-card__info--owner').getAttribute('href').split('/').pop();
            let preBvId = card.querySelector('.bili-video-card__info--right a[href^="//www.bilibili.com/video/BV"]').getAttribute('href').match(/\/BV[\w]+\//)[0].replace(/\//g, '');
            let preDanmaku = parseInt(card.querySelector('.bili-video-card__stats--item:nth-child(2) span').textContent);
            let prePlayCountText = card.querySelector('.bili-video-card__stats--item:nth-child(1) span').textContent.trim();
            let prePlayCount;//如果包含万 ,去万乘10000
            if (prePlayCountText.includes('万')) { prePlayCount = parseFloat(prePlayCountText.replace('万', '')) * 10000; }
            else { prePlayCount = parseInt(prePlayCountText); }

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
            console.log('获取到card:',preUpUid,preBvId,preDanmaku,prePlayCount,preDuration, prePublishDate,preVideoName);
        });
        console.log('获取到preInfoAndCard:', preInfoAndCard);

        // 筛选视频
        let preFilteredInfoAndCardList = preInfoAndCard.filter(video => {
            // 排除指定UP主
            if (excludeUids.includes(video.preUpUid)) { console.log(`up主在黑名单,排除《${video.preVideoName}》`); return false; }

            // 检查弹幕数
            if (video.preDanmaku < minDanmaku ) { console.log(`弹幕数量=${video.preDanmaku},排除《${video.preVideoName}》`); return false; }

            // 检查播放量
            if (video.prePlayCount < minPlayCount) { console.log(`播放量=${video.prePlayCount},排除《${video.preVideoName}》`); return false; }

            // 检查发布日期
            let start = new Date(dateStart);
            let end = new Date(dateEnd);
            if (Date(video.prePublishDate) < start || Date(video.prePublishDate) > end) { console.log(`发布日期不在范围内,排除《${video.preVideoName}》`); return false; }

            return true;
        });

        // 返回筛选后的BV号列表
        return preFilteredInfoAndCardList;
    }

    //---------------------------------------------------------进一步筛选------------------------------------------------

    // 函数：获取所有视频的详细信息
    // 参数：preFilteredInfoAndCardList - 预筛选信息+卡片数组
    // 返回值：视频详细信息数组
    async function getVideoDetailsArray(preFilteredInfoAndCardList) {
        let videoDetailsArray = [];
        for (const preFilteredInfoAndCard of preFilteredInfoAndCardList) {
            let bvId = preFilteredInfoAndCard.card.querySelector('.bili-video-card__info--right a[href^="//www.bilibili.com/video/BV"]').getAttribute('href').match(/\/BV[\w]+\//)[0].replace(/\//g, '');
            console.log('测试bv号:',bvId)
            const response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvId}`);
            const data = await response.json();
            if (data.code === 0) {
                const videoData = data.data;
                videoDetailsArray.push({
                    //todo:增加预筛选获取字段
                    bvid: videoData.bvid, // 视频的BV号
                    title: videoData.title, // 视频标题
                    pubdate: new Date(videoData.pubdate * 1000), // 发布日期，转换为日期对象
                    duration: videoData.duration, // 视频时长，单位为秒
                    view: videoData.stat.view.toString().includes('万') ? parseFloat(videoData.stat.view.toString().replace('万', '')) * 10000 : parseInt(videoData.stat.view.toString()), // 处理后的播放量
                    danmaku: videoData.stat.danmaku, // 弹幕数量
                    reply: videoData.stat.reply, // 评论数量
                    favorite: videoData.stat.favorite, // 收藏数量
                    coin: videoData.stat.coin, // 硬币数量
                    share: videoData.stat.share, // 分享数量
                    like: videoData.stat.like, // 点赞数量
                    upid: videoData.owner.mid, // UP主的用户ID
                    upname: videoData.owner.name, // UP主昵称
                    card: preFilteredInfoAndCard.card // 原始卡片元素
                });
            } else {
                console.error(`获取视频详细信息失败: ${data.message}`);
            }
        }
        console.log('视频详细信息数组:', videoDetailsArray);
        return videoDetailsArray;
    }

    // 函数：进一步筛选视频
    // 参数：videoDetailsArray - 视频详细信息数组
    // 参数：likeViewRatio - 点赞播放比下限
    // 参数：favoriteViewRatio - 收藏播放比下限
    // 参数：coinViewRatio - 投币播放比下限
    // 返回值：进一步筛选后的视频数组
    function furtherFilterVideos(videoDetailsArray, likeViewRatio, favoriteViewRatio, coinViewRatio) {
        console.log('进一步筛选视频');
        return videoDetailsArray.filter(video => {
            const likeViewRatioActual = video.like / video.view;
            const favoriteViewRatioActual = video.favorite / video.view;
            const coinViewRatioActual = video.coin / video.view;

            if (likeViewRatioActual < likeViewRatio) {console.log(`点赞播放比= ${likeViewRatioActual}, 排除视频《${video.title}》`);return false;}
            if (favoriteViewRatioActual < favoriteViewRatio) { console.log(`收藏播放比= ${favoriteViewRatioActual}, 排除视频《${video.title}》`); return false; }
            if (coinViewRatioActual < coinViewRatio) { console.log(`投币播放比= ${coinViewRatioActual}, 排除视频《${video.title}》`); return false; }

            return true;
        });
    }

    // 函数：排序视频
    // 参数：videoDetailsArray - 视频详细信息数组
    // 返回值：排序后的视频数组
    function sortVideos(videoDetailsArray, sortBy) {
        console.log('开始排序视频');
        return videoDetailsArray.sort((a, b) => b[sortBy] - a[sortBy]);
    }

    // 函数：视频按序写回页面 fatal:解决筛选出数量和显示的不一致  todo:识别并去掉纪录片/番剧/up主/活动
    // 参数：sortedArray - 排序后的视频信息数组
    function reorderVideos(sortedArray) {
        const container = document.evaluate('//*[@id="i_cecream"]/div/div[2]/div[2]/div/div/div/div[2]/div', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (!container) {
            console.log('找不到视频列表容器');
            return;
        }



        // 删除除了sortedArray.length个视频卡片之外的所有视频卡片及其父元素
        while (container.children.length > sortedArray.length) {
            container.removeChild(container.lastChild);
        }

        // 重新排序视频元素
        for (let i = 0; i < sortedArray.length; i++) {
            // 删除原有的card
            container.children[i].innerHTML = '';
            // 添加新的card
            container.children[i].appendChild(sortedArray[i].card);
        }


    }


    // 主函数：执行筛选和排序
    async function main() {

        //预筛选视频卡片
        let preFilteredCardList = filterAndExcludeByDate()//todo 待添加参数

        // 获取所有视频的详细信息
        let videoDetailsArray = await getVideoDetailsArray(preFilteredCardList);

        // 进一步筛选
        let furtherFilteredVideos = furtherFilterVideos(videoDetailsArray, likeViewRatio, favoriteViewRatio, coinViewRatio);
        console.log('进一步筛选后的视频:', furtherFilteredVideos);

        // 排序
        let sortedVideos = sortVideos(furtherFilteredVideos, 'coin');
        console.log('排序后的视频:', sortedVideos);

        // 输出结果到控制台
        console.log('最终筛选和排序后的视频列表:', sortedVideos.map(video => video.bvid));

        // 视频按序写回页面
        reorderVideos(sortedVideos);
    }


    //-------------------------------------------------------------



    // 模拟预筛选后的结果，使用当前页面的前三个卡片
    let excludeUids = [];
    let minDanmaku = 7;
    let minPlayCount = 2000;
    let dateStart = '2020-01-01';
    let dateEnd = '2024-07-31';
    let likeViewRatio = 0.05; // 赞播比
    let favoriteViewRatio = 0.008; // 藏播比
    let coinViewRatio = 0.0045; // 币播比

    // 等待页面加载完成
    window.addEventListener('load', function() {
        console.log('页面加载完成, 等待1秒后执行脚本');
        setTimeout(async () => {
            let cardList = Array.from(document.querySelectorAll('.bili-video-card')).slice(0, 20);//todo 待添加翻页填满功能(不着急)
            console.log('模拟数据获取成功:', cardList);
            // 执行主函数
            await main();
        }, 1000); // 等待1秒
    });
})();
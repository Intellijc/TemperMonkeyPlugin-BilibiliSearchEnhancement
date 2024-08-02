// ==UserScript==
// @name         Bilibili进一步筛选和排序组件
// @version      2.0
// @description  使用预筛选结果进行进一步筛选和排序。
// @match        https://search.bilibili.com/*
// @icon         https://www.bilibili.com/favicon.ico?v=1
// ==/UserScript==

; (function () {
    'use strict'

    // 函数：获取所有视频的详细信息
    // 参数：cardList - 视频卡片数组
    // 返回值：视频详细信息数组
    async function getVideoDetailsArray(cardList) {
        let videoDetailsArray = [];
        for (const card of cardList) {
            let bvId = card.querySelector('.bili-video-card__info--right a[href^="//www.bilibili.com/video/BV"]').getAttribute('href').match(/\/BV[\w]+\//)[0].replace(/\//g, '');
            console.log('测试bv号:${bvId}')
            const response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvId}`);
            const data = await response.json();
            if (data.code === 0) {
                const videoData = data.data;
                videoDetailsArray.push({
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
                    card: card // 原始卡片元素
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

    // 函数：视频按序写回页面
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

        // 获取所有视频的详细信息
        let videoDetailsArray = await getVideoDetailsArray(cardList);

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
    let likeViewRatio = 0.01; // 赞播比
    let favoriteViewRatio = 0.02; // 藏播比
    let coinViewRatio = 0.005; // 币播比
    let cardList;

    // 等待页面加载完成
    window.addEventListener('load', function() {
        console.log('页面加载完成, 等待1秒后执行脚本');
        setTimeout(async () => {
            cardList = Array.from(document.querySelectorAll('.bili-video-card')).slice(0, 4);
            console.log('模拟数据获取成功:', cardList);
            // 执行主函数
            await main();
        }, 1000); // 等待1秒
    });
})();
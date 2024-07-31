// ==UserScript==
// @name         B站搜索结果投币播放比排序（带调试功能）
// @namespace    http://tampermonkey.net/
// @version      1.7
// @description  在哔哩哔哩搜索结果页面，按投币播放比排序（仅限当前页），包含调试功能
// @author       You
// @match        *://search.bilibili.com/all*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const log = (message) => console.log(`[B站排序脚本] ${message}`);

    const extractNumber = (str) => {
        const num = parseInt(str.replace(/[^0-9]/g, ''));
        return isNaN(num) ? 0 : num;
    };

    const getVideoData = (element) => {
        try {
            const titleElement = element.querySelector('.bili-video-card__info--tit');
            const viewElement = element.querySelector('.bili-video-card__stats--item:first-child');
            const coinElement = element.querySelector('.bili-video-card__stats--item:nth-child(3)');

            if (!titleElement || !viewElement || !coinElement) {
                throw new Error('无法找到所需的元素');
            }

            const title = titleElement.getAttribute('title');
            const views = extractNumber(viewElement.innerText);
            const coins = extractNumber(coinElement.innerText);
            const coinRatio = coins ? views / coins : 0;

            return { element, title, views, coins, coinRatio };
        } catch (error) {
            log(`获取视频数据时出错: ${error.message}`);
            return null;
        }
    };

    const sortCurrentPageVideos = () => {
        try {
            const videoElements = document.querySelectorAll('.bili-video-card');
            const videoData = Array.from(videoElements)
                .map(getVideoData)
                .filter(data => data !== null);

            videoData.sort((a, b) => b.coinRatio - a.coinRatio);

            const container = document.querySelector('.video-list');
            if (!container) {
                throw new Error('无法找到视频列表容器');
            }

            videoData.forEach(item => {
                container.appendChild(item.element);
            });

            log(`成功排序 ${videoData.length} 个视频`);
        } catch (error) {
            log(`排序视频时出错: ${error.message}`);
        }
    };

    const createSortButton = () => {
        const button = document.createElement('button');
        button.textContent = '按投币播放比排序';
        button.style.cssText = `
            position: fixed;
            top: 70px;
            right: 20px;
            z-index: 9999;
            padding: 10px;
            background-color: #00a1d6;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        button.addEventListener('click', sortCurrentPageVideos);
        document.body.appendChild(button);
    };

    const createTestButton = () => {
        const button = document.createElement('button');
        button.textContent = '测试视频数据';
        button.style.cssText = `
            position: fixed;
            top: 120px;
            right: 20px;
            z-index: 9999;
            padding: 10px;
            background-color: #ff5722;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        `;
        button.addEventListener('click', testVideoData);
        document.body.appendChild(button);
    };

    const testVideoData = () => {
        const videoElements = document.querySelectorAll('.bili-video-card');
        log(`找到 ${videoElements.length} 个视频元素`);

        videoElements.forEach((element, index) => {
            const titleElement = element.querySelector('.bili-video-card__info--tit');
            const viewElement = element.querySelector('.bili-video-card__stats--item:first-child');
            const coinElement = element.querySelector('.bili-video-card__stats--item:nth-child(3)');

            log(`视频 ${index + 1}:`);
            log(`  标题元素: ${titleElement ? '存在' : '不存在'}`);
            log(`  播放量元素: ${viewElement ? '存在' : '不存在'}`);
            log(`  投币元素: ${coinElement ? '存在' : '不存在'}`);

            if (titleElement && viewElement && coinElement) {
                log(`  标题: ${titleElement.getAttribute('title')}`);
                log(`  播放量: ${viewElement.innerText}`);
                log(`  投币数: ${coinElement.innerText}`);
            }
            log('---');
        });
    };

    const waitForVideos = () => {
        return new Promise((resolve) => {
            const observer = new MutationObserver((mutations, obs) => {
                const videoList = document.querySelector('.video-list');
                if (videoList && videoList.children.length > 0) {
                    obs.disconnect();
                    resolve();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    };

    const init = async () => {
        log('脚本已加载，等待视频列表...');
        await waitForVideos();
        log('视频列表已加载');
        createSortButton();
        createTestButton();
    };

    // 页面加载完成后执行
    window.addEventListener('load', init);
})();
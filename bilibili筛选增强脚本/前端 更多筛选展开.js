// ==UserScript==
// @name         更多筛选
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  在Bilibili的更多筛选部分添加发布时间过滤器并调整视频列表位置
// @author       Intellijc
// @match        *://search.bilibili.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 等待元素出现
    function waitForElement(xpath, callback) {
        const observer = new MutationObserver(() => {
            const element = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
            if (element) {
                callback(element);
                observer.disconnect();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

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

        buttons.forEach(buttonInfo => {
            const button = document.createElement('div');
            button.className = 'filter-item';
            button.id = buttonInfo.id;
            button.innerText = buttonInfo.text;
            button.style.padding = '5px 10px';
            button.style.cursor = 'pointer';
            button.style.border = '1px solid #ddd';
            button.style.borderRadius = '4px';
            button.style.backgroundColor = '#f5f5f5';
            button.style.userSelect = 'none'; // 阻止按钮文字被选中

            // 添加点击事件监听器
            button.addEventListener('click', function () {
                if (buttonInfo.id === 'custom-start' || buttonInfo.id === 'custom-end') {
                    const dateInput = document.createElement('input');
                    dateInput.type = 'date';
                    dateInput.style.position = 'absolute';
                    dateInput.style.zIndex = '1001';
                    dateInput.style.left = event.pageX + 'px';
                    dateInput.style.top = event.pageY + 10 + 'px';
                    document.body.appendChild(dateInput);

                    dateInput.addEventListener('change', function () {
                        if (buttonInfo.id === 'custom-start') {
                            startDateInput.value = dateInput.value; // 显示选定的日期在文本框中
                        } else {
                            endDateInput.value = dateInput.value; // 显示选定的日期在文本框中
                        }
                        document.body.removeChild(dateInput);
                    });

                    dateInput.addEventListener('blur', function () { document.body.removeChild(dateInput); });// 在失焦时退出日期选择器

                    dateInput.focus();
                    dateInput.click();
                } else {
                    console.log(buttonInfo.text + ' clicked');
                    // 添加你的自定义逻辑
                }
            });

            publishTimeContainer.appendChild(button);
        });

        // 将按钮容器添加到筛选容器中
        container.appendChild(publishTimeContainer);

        // 在自定义起始日期按钮之后添加文本框
        const customStartButton = publishTimeContainer.querySelector('#custom-start');
        const startDateInput = document.createElement('input');
        startDateInput.type = 'text';
        startDateInput.placeholder = 'YYYY-MM-DD';
        startDateInput.style.padding = '5px';
        startDateInput.style.border = '1px solid #ddd';
        startDateInput.style.borderRadius = '4px';
        startDateInput.style.marginLeft = '10px';
        customStartButton.after(startDateInput);

        // 在自定义结束日期按钮之后添加文本框
        const customEndButton = publishTimeContainer.querySelector('#custom-end');
        const endDateInput = document.createElement('input');
        endDateInput.type = 'text';
        endDateInput.placeholder = 'YYYY-MM-DD';
        endDateInput.style.padding = '5px';
        endDateInput.style.border = '1px solid #ddd';
        endDateInput.style.borderRadius = '4px';
        endDateInput.style.marginLeft = '10px';
        customEndButton.before(endDateInput);

        // 在“确定选择日期”按钮的点击事件中返回起始和结束日期
        const confirmButton = publishTimeContainer.querySelector('#confirm-dates');
        confirmButton.addEventListener('click', function () {
            const today = new Date().toISOString().split('T')[0];
            let startDate = startDateInput.value || '2000-01-01'; // 如果为空，设置默认值
            let endDate = endDateInput.value || today; // 如果为空，设置为当天日期

            // 额外的日期条件处理
            if (new Date(startDate) < new Date('2000-01-01')) { startDate = '2000-01-01'; }
            if (new Date(endDate) < new Date('2000-01-01')) { endDate = '2000-01-01'; }
            if (new Date(startDate) > new Date(today)) { startDate = today; }
            if (new Date(endDate) > new Date(today)) { endDate = today; }

            if (new Date(startDate) > new Date(endDate)) { alert('起始日期>结束日期'); return; }

            startDateInput.value = startDate; endDateInput.value = endDate;
            console.log('确定选择的起始日期: ' + startDate);
            console.log('确定选择的结束日期: ' + endDate);
            // 在此添加自定义逻辑，例如提交日期范围进行筛选
        });


    }

    // 处理 "更多筛选" 按钮点击事件
    function handleMoreFilterButtonClick() {
        const moreFilterButtonXPath = '//*[@id="i_cecream"]/div/div[2]/div[1]/div[3]/div/div[1]/button';
        waitForElement(moreFilterButtonXPath, (moreFilterButton) => {
            moreFilterButton.addEventListener('click', function () {
                console.log("更多筛选被点击");
                const filterMenuXPath = '//*[@id="i_cecream"]/div/div[2]/div[1]/div[3]/div/div[2]';
                waitForElement(filterMenuXPath, (filterMenu) => {
                    addPublishTimeFilter(filterMenu);
                });
            });
        });
    }

    // 初始化脚本
    handleMoreFilterButtonClick();

})();

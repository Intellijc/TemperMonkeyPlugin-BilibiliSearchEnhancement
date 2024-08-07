// ==UserScript==
// @name         更多筛选
// @namespace    http://tampermonkey.net/
// @version      2.0
// @description  在Bilibili的更多筛选部分添加发布时间过滤器并调整视频列表位置
// @author       Intellijc
// @match        *://search.bilibili.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 提示模块
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

    // 处理 "更多筛选" 按钮点击事件
    function handleMoreFilterButtonClick() {
        const moreFilterButtonXPath = '//*[@id="i_cecream"]/div/div[2]/div[1]/div[3]/div/div[1]/button';
        const filterMenuXPath = '//*[@id="i_cecream"]/div/div[2]/div[1]/div[3]/div/div[2]';

        const moreFilterButton = document.evaluate(moreFilterButtonXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (moreFilterButton) {
            moreFilterButton.addEventListener('click', function () {
                console.log("更多筛选被点击");
                const filterMenu = document.evaluate(filterMenuXPath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
                if (filterMenu) {addPublishTimeFilter(filterMenu);}
            });
        }
    }

    // 初始化脚本
    handleMoreFilterButtonClick();
})();

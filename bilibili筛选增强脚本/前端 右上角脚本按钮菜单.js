// ==UserScript==
// @name         b站右上角默认设置弹窗
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  b站右上角默认设置弹窗
// @author       Intellijc
// @match        *://www.bilibili.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // 创建并添加按钮
    let button = document.createElement('div');
    button.id = "bilibili-filter-button";
    button.style.position = "fixed";
    button.style.top = "250px";
    button.style.right = "15px";
    button.style.padding = "10px 15px";
    button.style.backgroundColor = "#00A1D6";
    button.style.color = "#fff";
    button.style.borderRadius = "5px";
    button.style.cursor = "pointer";
    button.style.zIndex = "9999";
    button.innerText = "Bilibili筛选工具";
    document.body.appendChild(button);

    // 创建并添加设置面板
    let panel = document.createElement('div');
    panel.id = "bilibili-filter-panel";
    panel.style.display = "none";
    panel.style.position = "fixed";
    panel.style.top = (parseInt(button.style.top) + 40) + "px"; // 在按钮下方40px
    panel.style.right = button.style.right; // 和按钮右对齐
    panel.style.width = "300px";
    panel.style.padding = "20px";
    panel.style.backgroundColor = "#fff";
    panel.style.border = "1px solid #ccc";
    panel.style.borderRadius = "10px";
    panel.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.5)";
    panel.style.zIndex = "9999";
    panel.innerHTML = `
    <form id="bilibili-filter-form">
        <div style="margin-bottom: 15px;">
            <label>永久屏蔽UP主列表(uid):</label>
            <input type="text" id="blocked-uid-list" style="width: 100%;">
        </div>
        <div style="margin-bottom: 15px;">
            <label>永久屏蔽视频列表(bv号):</label>
            <input type="text" id="blocked-bv-list" style="width: 100%;">
        </div>
        <div style="margin-bottom: 15px;">
            <label>无缝翻页(暂不支持):</label>
            <label class="switch">
                <input type="checkbox" id="seamless-pagination">
                <span class="slider round"></span>
            </label>
        </div>
        <div style="margin-bottom: 15px;">
            <label>默认排序算法:</label>
            <select id="default-sort-algorithm" style="width: 100%;">
                <option value="default">B站默认</option>
                <option value="custom">自研排序算法</option>
                <option value="custom-params">自定义排序参数</option>
            </select>
        </div>
    </form>`;
    document.body.appendChild(panel);

    // 显示/隐藏设置面板
    button.addEventListener('click', function () {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        if (panel.style.display === 'block') {
            panel.style.top = (parseInt(button.style.top) + button.offsetHeight + 10) + "px"; // 更新面板位置
            panel.style.right = (window.innerWidth - button.getBoundingClientRect().right - 15) + "px"; // 更新面板右对齐
        }
    });

    // 保存设置到localStorage
    function saveSettings() {
        let blockedUids = document.getElementById('blocked-uid-list').value;
        let blockedBvs = document.getElementById('blocked-bv-list').value;
        let seamlessPagination = document.getElementById('seamless-pagination').checked;
        let defaultSortAlgorithm = document.getElementById('default-sort-algorithm').value;

        // 将设置保存到localStorage
        localStorage.setItem('bilibili-blocked-uids', blockedUids);
        localStorage.setItem('bilibili-blocked-bvs', blockedBvs);
        localStorage.setItem('bilibili-seamless-pagination', seamlessPagination);
        localStorage.setItem('bilibili-default-sort-algorithm', defaultSortAlgorithm);

        // 显示保存成功提示
        let saveAlert = document.createElement('div');
        saveAlert.style.position = "fixed";
        saveAlert.style.top = "10px";
        saveAlert.style.left = "50%";
        saveAlert.style.transform = "translateX(-50%)";
        saveAlert.style.padding = "10px 20px";
        saveAlert.style.backgroundColor = "#00A1D6";
        saveAlert.style.color = "#fff";
        saveAlert.style.borderRadius = "5px";
        saveAlert.style.zIndex = "9999";
        saveAlert.innerText = "设置已保存";
        document.body.appendChild(saveAlert);

        // 1秒后移除提示
        setTimeout(() => {
            document.body.removeChild(saveAlert);
        }, 1000);
    }

    // 当面板失去焦点时自动保存并隐藏面板
    panel.addEventListener('focusout', function (event) {
        // 检查是否点击在面板外部
        if (!panel.contains(event.relatedTarget)) {
            saveSettings();
            panel.style.display = 'none';
        }
    });

    // 加载设置
    window.addEventListener('load', function () {
        let blockedUids = localStorage.getItem('bilibili-blocked-uids');
        let blockedBvs = localStorage.getItem('bilibili-blocked-bvs');
        let seamlessPagination = localStorage.getItem('bilibili-seamless-pagination') === 'true';
        let defaultSortAlgorithm = localStorage.getItem('bilibili-default-sort-algorithm');

        document.getElementById('blocked-uid-list').value = blockedUids || '';
        document.getElementById('blocked-bv-list').value = blockedBvs || '';
        document.getElementById('seamless-pagination').checked = seamlessPagination;
        document.getElementById('default-sort-algorithm').value = defaultSortAlgorithm || 'default';
    });

    // 按钮拖动功能
    button.onmousedown = function (event) {
        event.preventDefault();

        let shiftX = event.clientX - button.getBoundingClientRect().left;
        let shiftY = event.clientY - button.getBoundingClientRect().top;

        function moveAt(pageX, pageY) {
            button.style.left = pageX - shiftX + 'px';
            button.style.top = pageY - shiftY + 'px';
            button.style.right = 'auto';
        }

        function onMouseMove(event) {
            moveAt(event.pageX, event.pageY);
        }

        document.addEventListener('mousemove', onMouseMove);

        button.onmouseup = function () {
            document.removeEventListener('mousemove', onMouseMove);
            button.onmouseup = null;
        };
    };

    button.ondragstart = function () {
        return false;
    };

})();

// ==UserScript==
// @name         Timetree跳过确认框
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  跳过删除备忘录时的确认提示框
// @author       Intellijc
// @match        https://timetreeapp.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    // Overwrite the confirm function to always return true
    window.confirm = function() {
        return true;
    };
    document.addEventListener('click', function(event) {
        if (event.target.matches('/html/body/div[25]/div/div/div[3] button')) {
            event.stopPropagation();
            console.log('成功阻止弹窗');
        }
    }, true);

})();

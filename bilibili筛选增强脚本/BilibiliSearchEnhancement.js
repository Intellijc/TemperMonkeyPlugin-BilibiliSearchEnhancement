// ==UserScript==
// @name         Bilibili Filter Button
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  Add a button to filter videos released within the last year on Bilibili
// @author       Your Name
// @match        *://www.bilibili.com/*
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // Function to add filter button
    function addFilterButton() {
        // Check if the search bar is present on the page
        const searchBar = document.querySelector('.nav-search-input');
        if (!searchBar) return;

        // Create the filter button
        const filterButton = document.createElement('button');
        filterButton.textContent = 'Filter Last Year';
        filterButton.style.marginLeft = '10px';
        filterButton.style.marginTop = '30px'
        filterButton.style.padding = '5px 10px';
        filterButton.style.border = '1px solid #ccc';
        filterButton.style.background = '#00A1D6';
        filterButton.style.color = '#fff';
        filterButton.style.cursor = 'pointer';

        // Append the button to the search bar container
        searchBar.parentElement.appendChild(filterButton);

        // Add click event listener to the filter button
        filterButton.addEventListener('click', function () {
            // Get the current search query
            const searchQuery = document.querySelector('.nav-search-input input').value;
            if (!searchQuery) return;

            // Get the current date and date of one year ago
            const currentDate = new Date();
            const lastYearDate = new Date();
            lastYearDate.setFullYear(currentDate.getFullYear() - 1);

            // Format the dates to YYYY-MM-DD
            const currentDateStr = currentDate.toISOString().split('T')[0];
            const lastYearDateStr = lastYearDate.toISOString().split('T')[0];

            // Redirect to the search results page with the date filter applied
            const searchUrl = `https://search.bilibili.com/all?keyword=${encodeURIComponent(searchQuery)}&from_source=nav_search&order=pubdate&duration=0&tids_1=0&page=1&pubtime=${lastYearDateStr},${currentDateStr}`;
            window.location.href = searchUrl;
        });
    }

    // Run the function to add the filter button after the page loads
    window.addEventListener('load', addFilterButton);
})();

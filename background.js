// background.js

const INDEX_PAGE_URL = chrome.runtime.getURL('src/index.html');
let chartTabId = null; // Store the ID of the opened tab

chrome.action.onClicked.addListener(async (tab) => {
  if (chartTabId !== null) {
    // Check if the previously opened tab still exists
    try {
      const existingTab = await chrome.tabs.get(chartTabId);
      if (existingTab && existingTab.url === INDEX_PAGE_URL) {
        // Tab exists and is the correct page, activate it
        await chrome.tabs.update(chartTabId, { active: true });
        return; // Exit as we've jumped to the existing tab
      }
    } catch (error) {
      // Tab might have been closed or URL changed, reset chartTabId
      console.warn(`Previously tracked tab (${chartTabId}) no longer valid or changed: ${error.message}`);
      chartTabId = null;
    }
  }

  // If no existing valid tab, or an error occurred, open a new one
  const newTab = await chrome.tabs.create({ url: INDEX_PAGE_URL });
  chartTabId = newTab.id;
  console.log(`Opened new QuikNatalChartMaker tab with ID: ${chartTabId}`);
});

// Optional: Listen for tab closing to reset chartTabId
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  if (tabId === chartTabId) {
    console.log(`QuikNatalChartMaker tab with ID ${tabId} closed.`);
    chartTabId = null;
  }
});

console.log("QuikNatalChartMaker background service worker started.");
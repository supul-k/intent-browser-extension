// Initialize storage with default settings
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['settings'], (result) => {
    if (!result.settings) {
      // Default settings
      const defaultSettings = {
        categories: {
          'facebook.com': 'distraction',
          'twitter.com': 'distraction',
          'instagram.com': 'distraction',
          'reddit.com': 'distraction',
          'youtube.com': 'neutral',
          'github.com': 'focus',
          'stackoverflow.com': 'focus',
          'medium.com': 'neutral'
        },
        mindfulAccessEnabled: true,
        mindfulDelaySeconds: 5
      };
      
      chrome.storage.local.set({ settings: defaultSettings });
    }
  });
  
  // Start tracking
  startTracking();
});

// Track active tab changes
let currentTabId = null;
let currentDomain = null;
let startTime = null;

function startTracking() {
  // Get current active tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      handleTabChange(tabs[0]);
    }
  });
  
  // Listen for tab activation
  chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      handleTabChange(tab);
    });
  });
  
  // Listen for tab updates (URL changes)
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url && tab.active) {
      handleTabChange(tab);
    }
  });
}

function handleTabChange(tab) {
  if (!tab.url) return;
  
  // Save time for previous tab
  if (currentDomain && startTime) {
    saveVisit(currentDomain, Date.now() - startTime);
  }
  
  // Start tracking new tab
  try {
    const url = new URL(tab.url);
    currentDomain = url.hostname;
    startTime = Date.now();
    currentTabId = tab.id;
    
    // Check if this is a distraction site and mindful access is enabled
    checkMindfulAccess(currentDomain, tab.id);
  } catch (e) {
    console.log('Invalid URL:', tab.url);
  }
}

function saveVisit(domain, duration) {
  if (duration < 1000) return; // Ignore very short visits
  
  const visit = {
    domain,
    duration: Math.round(duration / 1000), // Convert to seconds
    timestamp: Date.now()
  };
  
  chrome.storage.local.get(['visits'], (result) => {
    const visits = result.visits || [];
    visits.push(visit);
    
    // Keep only last 30 days of visits
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const filteredVisits = visits.filter(v => v.timestamp > thirtyDaysAgo);
    
    chrome.storage.local.set({ visits: filteredVisits });
  });
}

function checkMindfulAccess(domain, tabId) {
  chrome.storage.local.get(['settings'], (result) => {
    const settings = result.settings || {};
    const category = settings.categories?.[domain] || 'neutral';
    
    if (settings.mindfulAccessEnabled && category === 'distraction') {
      // We'll implement the mindful modal later via content script
      chrome.tabs.sendMessage(tabId, { 
        type: 'MINDFUL_CHECK', 
        domain,
        delay: settings.mindfulDelaySeconds || 5
      });
    }
  });
}

// Set up alarm for periodic cleanup (every hour)
chrome.alarms.create('cleanup', { periodInMinutes: 60 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanup') {
    // Clean up old data
    chrome.storage.local.get(['visits'], (result) => {
      const visits = result.visits || [];
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      const filteredVisits = visits.filter(v => v.timestamp > thirtyDaysAgo);
      chrome.storage.local.set({ visits: filteredVisits });
    });
  }
});
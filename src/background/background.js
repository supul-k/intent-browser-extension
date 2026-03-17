import db from './database.js';

// Initialize database
db.init().then(() => {
  console.log('Intent database initialized');
});

// Update handleTabChange to save to database
function handleTabChange(tab) {
  if (!tab.url) return;
  
  // Save time for previous tab
  if (currentDomain && startTime) {
    const duration = Date.now() - startTime;
    if (duration > 1000) { // Only track > 1 second
      db.addVisit({
        domain: currentDomain,
        duration: Math.round(duration / 1000),
        url: tab.url
      });
    }
  }
  
  // Start tracking new tab
  try {
    const url = new URL(tab.url);
    currentDomain = url.hostname;
    startTime = Date.now();
    currentTabId = tab.id;
    
    checkMindfulAccess(currentDomain, tab.id);
  } catch (e) {
    console.log('Invalid URL:', tab.url);
  }
}

// Update SET_INTENTION handler
if (message.type === 'SET_INTENTION') {
  currentIntention = message.intention;
  
  // Save to database
  db.addIntention(message.intention);
  
  // Broadcast to all tabs
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { 
        type: 'INTENTION_UPDATED', 
        intention: currentIntention 
      }).catch(() => {});
    });
  });
  
  sendResponse({ success: true });
}

// Update DISTRACTION_ACTION handler
if (message.type === 'DISTRACTION_ACTION') {
  db.addAction(message);
  sendResponse({ success: true });
}

// Update GET_TODAY_STATS handler
if (message.type === 'GET_TODAY_STATS') {
  db.getTodaySummary().then(stats => sendResponse(stats));
  return true;
}

if (message.type === 'GET_WEEKLY_REPORT') {
  db.getWeeklyReport().then(report => sendResponse(report));
  return true;
}
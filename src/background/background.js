// background.js - With tab tracking and mindful modal
console.log("🔥 BACKGROUND STARTING...");

// State
let currentIntention = null;
let currentTabId = null;
let currentDomain = null;
let startTime = null;
let snoozedDomains = {};

// Initialize
chrome.runtime.onInstalled.addListener(() => {
  console.log("✅ Extension installed");

  // In your onInstalled listener, update the categories:
  chrome.storage.local.set({
    settings: {
      categories: {
        // With and without www
        "facebook.com": "distraction",
        "www.facebook.com": "distraction",
        "twitter.com": "distraction",
        "www.twitter.com": "distraction",
        "instagram.com": "distraction",
        "www.instagram.com": "distraction",
        "reddit.com": "distraction",
        "www.reddit.com": "distraction",
        "tiktok.com": "distraction",
        "www.tiktok.com": "distraction",
        "youtube.com": "neutral",
        "www.youtube.com": "neutral",
        "github.com": "focus",
        "www.github.com": "focus",
        "stackoverflow.com": "focus",
        "www.stackoverflow.com": "focus",
        "medium.com": "neutral",
        "www.medium.com": "neutral",
        "docs.google.com": "focus",
      },
      mindfulAccessEnabled: true,
      mindfulDelaySeconds: 5,
    },
  });

  // Start tracking
  startTabTracking();
});

// Start tracking tabs
function startTabTracking() {
  console.log("👀 Starting tab tracking...");

  // Get current tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) handleTabChange(tabs[0]);
  });

  // Listen for tab changes
  chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
      handleTabChange(tab);
    });
  });

  // Listen for URL changes
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url && tab.active) {
      handleTabChange(tab);
    }
  });
}

// Handle tab change
function handleTabChange(tab) {
  if (!tab.url || !tab.url.startsWith("http")) return;

  // Save previous tab time
  if (currentDomain && startTime) {
    const duration = Date.now() - startTime;
    if (duration > 2000) {
      // More than 2 seconds
      console.log(
        `⏱️ Spent ${Math.round(duration / 1000)}s on ${currentDomain}`,
      );

      // Save visit (we'll implement storage later)
      saveVisit(currentDomain, duration);
    }
  }

  // Start tracking new tab
  try {
    const url = new URL(tab.url);
    currentDomain = url.hostname;
    startTime = Date.now();
    currentTabId = tab.id;

    console.log("🔄 Switched to:", currentDomain);

    // Check if we should show mindful modal
    checkMindfulAccess(currentDomain, tab.id);
  } catch (e) {
    console.log("Invalid URL:", tab.url);
  }
}

// Check if we should show mindful modal
function checkMindfulAccess(domain, tabId) {
  console.log("🔍 CHECKING ACCESS - Domain:", domain, "Tab:", tabId);

  chrome.storage.local.get(["settings", "currentIntention"], (result) => {
    console.log("📦 Storage data:", result);

    const settings = result.settings || {};
    const categories = settings.categories || {};

    // IMPROVED: Check multiple domain formats
    let category = "neutral";

    // Try exact match first
    if (categories[domain] !== undefined) {
      category = categories[domain];
      console.log("✅ Exact match found:", domain, "=", category);
    }
    // Try without www.
    else if (
      domain.startsWith("www.") &&
      categories[domain.substring(4)] !== undefined
    ) {
      category = categories[domain.substring(4)];
      console.log("✅ Match without www:", domain.substring(4), "=", category);
    }
    // Try with www. added
    else if (categories["www." + domain] !== undefined) {
      category = categories["www." + domain];
      console.log("✅ Match with www:", "www." + domain, "=", category);
    }
    // Try base domain (for subdomains like mail.google.com)
    else {
      const parts = domain.split(".");
      if (parts.length > 2) {
        const baseDomain = parts.slice(-2).join(".");
        if (categories[baseDomain] !== undefined) {
          category = categories[baseDomain];
          console.log("✅ Base domain match:", baseDomain, "=", category);
        }
      }
    }

    console.log(`📊 Final category for ${domain}:`, category);
    console.log("⚙️ Mindful enabled:", settings.mindfulAccessEnabled);

    // Skip if snoozed
    if (snoozedDomains[domain] && snoozedDomains[domain] > Date.now()) {
      console.log("😴 Domain snoozed until:", new Date(snoozedDomains[domain]));
      return;
    }

    // Show modal for distraction sites
    if (settings.mindfulAccessEnabled && category === "distraction") {
      console.log("🎯 SHOULD SHOW MODAL - Sending message to tab:", tabId);

      chrome.tabs.sendMessage(
        tabId,
        {
          type: "SHOW_MINDFUL_MODAL",
          domain: domain,
          intention: result.currentIntention || "No active intention",
          delay: settings.mindfulDelaySeconds || 5,
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error(
              "❌ Failed to send message:",
              chrome.runtime.lastError,
            );
          } else {
            console.log("✅ Modal shown, response:", response);
          }
        },
      );
    } else {
      console.log(
        "✅ No modal needed - condition not met (category:",
        category,
        "enabled:",
        settings.mindfulAccessEnabled,
        ")",
      );
    }
  });
}

// Save visit (temporary - we'll add proper DB later)
function saveVisit(domain, duration) {
  chrome.storage.local.get(["visits"], (result) => {
    const visits = result.visits || [];
    visits.push({
      domain,
      duration: Math.round(duration / 1000),
      timestamp: Date.now(),
      date: new Date().toISOString().split("T")[0],
    });

    // Keep last 100 visits
    if (visits.length > 100) visits.shift();

    chrome.storage.local.set({ visits });
  });
}

// Handle snoozing
function snoozeDomain(domain, minutes) {
  snoozedDomains[domain] = Date.now() + minutes * 60 * 1000;
  console.log("😴 Snoozed", domain, "for", minutes, "minutes");

  setTimeout(
    () => {
      delete snoozedDomains[domain];
      console.log("⏰ Snooze expired for", domain);
    },
    minutes * 60 * 1000,
  );
}

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("📨 Message received:", message.type);

  if (message.type === "SET_INTENTION") {
    currentIntention = message.intention;
    chrome.storage.local.set({ currentIntention: message.intention });
    sendResponse({ success: true });
  } else if (message.type === "GET_CURRENT_INTENTION") {
    sendResponse({ intention: currentIntention });
  } else if (message.type === "GET_TODAY_STATS") {
    chrome.storage.local.get(["visits", "settings"], (result) => {
      const today = new Date().setHours(0, 0, 0, 0);
      const visits = (result.visits || []).filter((v) => v.timestamp >= today);
      const categories = result.settings?.categories || {};

      let focusTime = 0;
      let distractionTime = 0;

      visits.forEach((visit) => {
        const category = categories[visit.domain] || "neutral";
        if (category === "focus") focusTime += visit.duration;
        if (category === "distraction") distractionTime += visit.duration;
      });

      sendResponse({
        focusTime,
        distractionTime,
        interruptions: 0, // We'll track these later
        resisted: 0,
      });
    });
    return true;
  } else if (message.type === "DISTRACTION_ACTION") {
    console.log("🚫 Action:", message.action, "on", message.domain);

    if (message.action === "snooze") {
      snoozeDomain(message.domain, message.duration || 30);
    }

    // Save action (we'll track these later)
    chrome.storage.local.get(["actions"], (result) => {
      const actions = result.actions || [];
      actions.push({
        ...message,
        timestamp: Date.now(),
      });
      chrome.storage.local.set({ actions });
    });

    sendResponse({ success: true });
  } else if (message.type === "PING") {
    sendResponse({ pong: true });
  }

  return true;
});

console.log("✅ Background fully loaded");

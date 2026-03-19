// content.js - Enhanced for all sites (keeps your working modal)
console.log('🧩 Content script loaded on:', window.location.hostname);
console.log('🔧 Content script details:', {
  runtime: !!chrome.runtime,
  runtimeId: chrome.runtime?.id,
  hasListeners: !!chrome.runtime?.onMessage,
  canSendMessage: !!chrome.runtime?.sendMessage
});

// Add visual indicator
const indicator = document.createElement('div');
indicator.id = 'intent-debug';
indicator.style.cssText = `
  position: fixed;
  top: 10px;
  right: 10px;
  background: #ff4444;
  color: white;
  padding: 8px 12px;
  border-radius: 4px;
  z-index: 999999;
  font-family: monospace;
  font-size: 12px;
  cursor: pointer;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
`;
indicator.textContent = '🧠 Intent: Connecting...';
document.body.appendChild(indicator);

// Click indicator to show manual modal (for sites where background is unreachable)
indicator.onclick = () => {
  chrome.storage.local.get(['currentIntention'], (result) => {
    showManualModal(result.currentIntention);
  });
};

function showManualModal(intention) {
  // Create a simple modal for manual checking
  const modal = document.createElement('div');
  modal.id = 'intent-manual-modal';
  modal.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 30px;
      border-radius: 12px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      z-index: 1000000;
      max-width: 400px;
      text-align: center;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    ">
      <div style="font-size: 48px; margin-bottom: 16px;">🧘</div>
      <h2 style="margin: 0 0 16px 0;">Mindful Moment</h2>
      <p style="margin-bottom: 16px; color: #666;">
        Your current intention:<br>
        <strong style="color: #2c3e50; font-size: 18px;">
          "${intention || 'Not set'}"
        </strong>
      </p>
      <p style="margin-bottom: 24px; color: #666;">
        You're on <strong>${window.location.hostname}</strong>
      </p>
      <button onclick="this.parentElement.parentElement.remove()" style="
        padding: 10px 20px;
        background: #3498db;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
      ">Close</button>
    </div>
  `;
  document.body.appendChild(modal);
}

// Update indicator when messages received
function updateIndicator(status, color, permanent = false) {
  indicator.style.background = color;
  indicator.textContent = status;
  
  if (!permanent) {
    setTimeout(() => {
      indicator.style.background = '#27ae60';
      indicator.textContent = '🧠 Intent: Active';
    }, 2000);
  }
}

// Try multiple connection methods
async function connectToBackground() {
  // Method 1: Direct message
  try {
    chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
      if (chrome.runtime.lastError) {
        console.log('⚠️ Method 1 failed:', chrome.runtime.lastError);
        tryMethod2();
      } else {
        console.log('✅ Method 1 succeeded');
        indicator.style.background = '#27ae60';
        indicator.textContent = '🧠 Intent: Active';
        setupMessageListener();
      }
    });
  } catch (e) {
    console.log('⚠️ Method 1 exception:', e);
    tryMethod2();
  }
  
  // Method 2: Connect port
  function tryMethod2() {
    try {
      const port = chrome.runtime.connect({ name: 'content-script' });
      port.postMessage({ type: 'PING' });
      
      port.onMessage.addListener((msg) => {
        if (msg.type === 'PONG') {
          console.log('✅ Method 2 succeeded');
          indicator.style.background = '#27ae60';
          indicator.textContent = '🧠 Intent: Active';
          setupPortListener(port);
        }
      });
      
      port.onDisconnect.addListener(() => {
        console.log('⚠️ Port disconnected');
        enterLimitedMode();
      });
    } catch (e) {
      console.log('⚠️ Method 2 failed:', e);
      enterLimitedMode();
    }
  }
  
  function enterLimitedMode() {
    console.log('⚠️ Entering limited mode');
    indicator.style.background = '#f39c12';
    indicator.textContent = '🧠 Intent: Limited';
    indicator.title = 'Click to check intention';
    
    // Still try to get intention from storage
    chrome.storage.local.get(['currentIntention'], (result) => {
      if (result.currentIntention) {
        console.log('📝 Current intention:', result.currentIntention);
      }
    });
  }
}

function setupMessageListener() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('📨 CONTENT SCRIPT RECEIVED MESSAGE:', message);
    updateIndicator('📨 Message!', '#44ff44');
    
    if (message.type === 'SHOW_MINDFUL_MODAL') {
      console.log('🎯 SHOW_MINDFUL_MODAL received!');
      showMindfulModal(message.domain, message.intention, message.delay);
      sendResponse({ shown: true });
    }
    return true;
  });
}

function setupPortListener(port) {
  port.onMessage.addListener((message) => {
    console.log('📨 Port message:', message);
    updateIndicator('📨 Message!', '#44ff44');
    
    if (message.type === 'SHOW_MINDFUL_MODAL') {
      showMindfulModal(message.domain, message.intention, message.delay);
    }
  });
}

// Start connection attempts
connectToBackground();

// Keep your EXISTING showMindfulModal function here - unchanged!
// (Paste your showMindfulModal function here)
console.log('👂 Content script listener registered');
console.log('📋 Current listener count:', chrome.runtime.onMessage ? 'has listeners' : 'no listeners');
function showMindfulModal(domain, currentIntention, delaySeconds = 5) {
  // Don't show if already showing
  if (document.getElementById('intent-modal')) return;
  
  console.log('🧘 Showing mindful modal for:', domain);
  
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'intent-modal';
  modal.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      animation: intent-fade-in 0.3s ease;
    ">
      <div style="
        background: white;
        padding: 32px;
        border-radius: 16px;
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      ">
        <div style="font-size: 48px; margin-bottom: 16px;">🧘</div>
        
        <h2 style="margin: 0 0 8px 0; color: #1e293b;">Mindful Moment</h2>
        
        <div style="
          background: #f0f9ff;
          padding: 12px;
          border-radius: 8px;
          margin: 16px 0;
          color: #0369a1;
          font-style: italic;
        ">
          "${currentIntention || 'No active intention'}"
        </div>
        
        <p style="color: #475569; margin-bottom: 20px;">
          You're about to visit <strong>${domain}</strong>
        </p>
        
        <div style="margin: 24px 0;" id="intent-timer-container">
          <div style="font-size: 14px; color: #64748b; margin-bottom: 8px;">
            Page will load in <span id="intent-timer">${delaySeconds}</span>s
          </div>
          <div style="
            width: 100%;
            height: 4px;
            background: #e2e8f0;
            border-radius: 2px;
            overflow: hidden;
          ">
            <div id="intent-progress" style="
              width: 100%;
              height: 100%;
              background: #3498db;
              transition: width 1s linear;
            "></div>
          </div>
        </div>
        
        <div style="display: flex; gap: 12px;">
          <button id="intent-continue" style="
            flex: 1;
            padding: 12px;
            background: #27ae60;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          ">
            ✓ Continue
          </button>
          
          <button id="intent-cancel" style="
            flex: 1;
            padding: 12px;
            background: #e74c3c;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
          ">
            ✗ Go Back
          </button>
        </div>
        
        <button id="intent-snooze" style="
          margin-top: 16px;
          padding: 8px;
          background: none;
          border: none;
          color: #64748b;
          text-decoration: underline;
          cursor: pointer;
          font-size: 13px;
        ">
          Remind me later (30 min)
        </button>
      </div>
    </div>
    
    <style>
      @keyframes intent-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    </style>
  `;
  
  document.body.appendChild(modal);
  
  // Countdown timer
  let secondsLeft = delaySeconds;
  const timerSpan = document.getElementById('intent-timer');
  const progressBar = document.getElementById('intent-progress');
  
  const timer = setInterval(() => {
    secondsLeft--;
    if (timerSpan) timerSpan.textContent = secondsLeft;
    if (progressBar) {
      const percent = (secondsLeft / delaySeconds) * 100;
      progressBar.style.width = percent + '%';
    }
    
    if (secondsLeft <= 0) {
      clearInterval(timer);
      // Auto-continue if time runs out
      document.getElementById('intent-continue')?.click();
    }
  }, 1000);
  
  // Continue button
  document.getElementById('intent-continue').onclick = () => {
    clearInterval(timer);
    modal.remove();
    
    // Tell background we continued
    chrome.runtime.sendMessage({
      type: 'DISTRACTION_ACTION',
      action: 'continued',
      domain: domain
    });
  };
  
  // Cancel button
  document.getElementById('intent-cancel').onclick = () => {
    clearInterval(timer);
    modal.remove();
    
    // Tell background we canceled
    chrome.runtime.sendMessage({
      type: 'DISTRACTION_ACTION',
      action: 'canceled',
      domain: domain
    });
    
    // Go back
    window.history.back();
  };
  
  // Snooze button
  document.getElementById('intent-snooze').onclick = () => {
    clearInterval(timer);
    modal.remove();
    
    // Tell background to snooze
    chrome.runtime.sendMessage({
      type: 'DISTRACTION_ACTION',
      action: 'snooze',
      domain: domain,
      duration: 30
    });
  };
}
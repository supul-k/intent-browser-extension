// content/content.js
// This runs on every webpage

// Store the current intention (received from background)
let currentIntention = null;
let modalShown = false;

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Content script received:', message);
  
  if (message.type === 'MINDFUL_CHECK') {
    // Don't show multiple modals
    if (!modalShown) {
      showMindfulModal(message.domain, message.delay);
    }
  }
  
  if (message.type === 'INTENTION_UPDATED') {
    currentIntention = message.intention;
  }
});

function showMindfulModal(domain, delaySeconds = 5) {
  modalShown = true;
  
  // Create modal container
  const modal = document.createElement('div');
  modal.id = 'intent-mindful-modal';
  modal.innerHTML = `
    <div style="
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    ">
      <div style="
        background: white;
        padding: 30px;
        border-radius: 12px;
        max-width: 400px;
        text-align: center;
        box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      ">
        <h2 style="margin-top: 0; color: #2c3e50;">Mindful Moment</h2>
        
        <div id="intent-current-intention" style="
          background: #f0f7ff;
          padding: 10px;
          border-radius: 6px;
          margin: 15px 0;
          font-style: italic;
        ">
          ${currentIntention ? `Your intention: "${currentIntention}"` : 'No active intention set'}
        </div>
        
        <p style="color: #34495e;">
          You're about to visit <strong>${domain}</strong>
        </p>
        
        <p style="color: #7f8c8d; font-size: 14px;">
          Is this aligned with your current intention?
        </p>
        
        <div style="margin: 20px 0;">
          <button id="intent-continue" style="
            background: #27ae60;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            margin-right: 10px;
            cursor: pointer;
            font-size: 14px;
          ">Yes, continue</button>
          
          <button id="intent-cancel" style="
            background: #e74c3c;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
          ">No, go back</button>
        </div>
        
        <div style="margin-top: 15px; font-size: 12px; color: #95a5a6;">
          <span id="intent-timer">${delaySeconds}</span> seconds until page loads...
        </div>
        
        <button id="intent-remind-later" style="
          background: none;
          border: none;
          color: #3498db;
          text-decoration: underline;
          margin-top: 10px;
          cursor: pointer;
          font-size: 12px;
        ">Remind me later for this site</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Countdown timer
  let secondsLeft = delaySeconds;
  const timerSpan = document.getElementById('intent-timer');
  const timerInterval = setInterval(() => {
    secondsLeft--;
    if (timerSpan) timerSpan.textContent = secondsLeft;
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
    }
  }, 1000);
  
  // Handle continue button
  document.getElementById('intent-continue').onclick = () => {
    clearInterval(timerInterval);
    modal.remove();
    modalShown = false;
    
    // Tell background we continued
    chrome.runtime.sendMessage({ 
      type: 'DISTRACTION_ACTION', 
      action: 'continued',
      domain: domain
    });
  };
  
  // Handle cancel button
  document.getElementById('intent-cancel').onclick = () => {
    clearInterval(timerInterval);
    modal.remove();
    modalShown = false;
    
    // Tell background we canceled
    chrome.runtime.sendMessage({ 
      type: 'DISTRACTION_ACTION', 
      action: 'canceled',
      domain: domain
    });
    
    // Go back
    window.history.back();
  };
  
  // Handle remind later
  document.getElementById('intent-remind-later').onclick = () => {
    clearInterval(timerInterval);
    modal.remove();
    modalShown = false;
    
    // Tell background to temporarily allow this site
    chrome.runtime.sendMessage({ 
      type: 'DISTRACTION_ACTION', 
      action: 'snooze',
      domain: domain,
      duration: 30 // minutes
    });
  };
}
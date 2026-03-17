// content/content.js
// This runs on every webpage

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'MINDFUL_CHECK') {
    // Show a modal asking "Is this aligned with your intention?"
    showMindfulModal(message.domain, message.delay);
  }
});

function showMindfulModal(domain, delay) {
  // Create and inject a modal into the page
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div style="position:fixed; top:50%; left:50%; background:white; padding:20px;">
      <p>You're about to visit ${domain}</p>
      <p>Is this aligned with your current intention?</p>
      <button id="continue">Yes, continue</button>
      <button id="cancel">No, go back</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Handle user choice
  document.getElementById('continue').onclick = () => {
    modal.remove();
    // Tell background we continued
    chrome.runtime.sendMessage({ type: 'CONTINUED_TO_DISTRACTION' });
  };
  
  document.getElementById('cancel').onclick = () => {
    // Navigate back
    window.history.back();
    modal.remove();
  };
}
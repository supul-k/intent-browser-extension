// popup.js - Simplified for testing
console.log('🚀 Popup script started');

document.addEventListener('DOMContentLoaded', () => {
  console.log('📄 DOM loaded');
  
  const intentionInput = document.getElementById('intention-input');
  const setButton = document.getElementById('set-intention');
  const statusDiv = document.getElementById('status-message');
  const testButton = document.getElementById('test-connection');
  
  console.log('Elements found:', {
    input: !!intentionInput,
    button: !!setButton,
    status: !!statusDiv,
    test: !!testButton
  });
  
  // Test connection button
  if (testButton) {
    testButton.addEventListener('click', () => {
      console.log('🧪 Testing connection...');
      
      if (!chrome.runtime || !chrome.runtime.id) {
        console.error('❌ Extension context invalid');
        showStatus('Extension not properly loaded', 'error');
        return;
      }
      
      try {
        chrome.runtime.sendMessage({ type: 'PING' }, (response) => {
          if (chrome.runtime.lastError) {
            console.error('❌ Connection failed:', chrome.runtime.lastError);
            showStatus('Connection failed: ' + chrome.runtime.lastError.message, 'error');
          } else {
            console.log('✅ Connection successful:', response);
            showStatus('✅ Connected to background!', 'success');
          }
        });
      } catch (e) {
        console.error('❌ Exception:', e);
        showStatus('Error: ' + e.message, 'error');
      }
    });
  }
  
  // Set intention button
  if (setButton) {
    setButton.addEventListener('click', () => {
      const intention = intentionInput ? intentionInput.value : '';
      console.log('🎯 Set clicked, intention:', intention);
      
      if (!intention) {
        showStatus('Please enter an intention', 'error');
        return;
      }
      
      if (!chrome.runtime || !chrome.runtime.id) {
        console.error('❌ Extension context invalid');
        showStatus('Extension error - please reload', 'error');
        return;
      }
      
      try {
        chrome.runtime.sendMessage(
          { type: 'SET_INTENTION', intention: intention },
          (response) => {
            if (chrome.runtime.lastError) {
              console.error('❌ Runtime error:', chrome.runtime.lastError);
              showStatus('Error: ' + chrome.runtime.lastError.message, 'error');
            } else {
              console.log('✅ Response:', response);
              if (response && response.success) {
                intentionInput.value = '';
                document.getElementById('current-intention').textContent = intention;
                showStatus('✅ Intention set!', 'success');
              }
            }
          }
        );
      } catch (e) {
        console.error('❌ Exception:', e);
        showStatus('Error: ' + e.message, 'error');
      }
    });
  }
  
  // Load current intention
  chrome.storage.local.get(['currentIntention'], (result) => {
    console.log('Loaded intention from storage:', result.currentIntention);
    if (result.currentIntention) {
      document.getElementById('current-intention').textContent = result.currentIntention;
    }
  });
  
  // Load stats
  loadStats();
  
  function loadStats() {
    chrome.runtime.sendMessage({ type: 'GET_TODAY_STATS' }, (stats) => {
      if (stats && !chrome.runtime.lastError) {
        document.getElementById('focus-time').textContent = 
          Math.round((stats.focusTime || 0) / 60) + 'm';
        document.getElementById('distraction-time').textContent = 
          Math.round((stats.distractionTime || 0) / 60) + 'm';
        document.getElementById('interruptions').textContent = 
          stats.interruptions || 0;
        document.getElementById('resisted').textContent = 
          stats.resisted || 0;
      }
    });
  }
  
  function showStatus(message, type) {
    console.log('Status:', message, type);
    if (statusDiv) {
      statusDiv.textContent = message;
      statusDiv.className = `status ${type}`;
      statusDiv.style.display = 'block';
      
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 2000);
    }
  }
});
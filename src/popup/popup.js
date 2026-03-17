document.addEventListener('DOMContentLoaded', () => {
  // Load today's stats
  loadTodayStats();
  
  // Set intention button
  document.getElementById('set-intention').addEventListener('click', () => {
    const intention = document.getElementById('intention-input').value;
    if (intention) {
      chrome.storage.local.set({ currentIntention: intention });
      document.getElementById('intention-input').value = '';
      alert('Intention set!');
    }
  });
  
  // Open options
  document.getElementById('open-options').addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });
});

function loadTodayStats() {
  chrome.storage.local.get(['visits'], (result) => {
    const visits = result.visits || [];
    const today = new Date().setHours(0, 0, 0, 0);
    
    // Filter today's visits
    const todayVisits = visits.filter(v => v.timestamp >= today);
    
    // Get settings to categorize domains
    chrome.storage.local.get(['settings'], (settingsResult) => {
      const settings = settingsResult.settings || {};
      const categories = settings.categories || {};
      
      let focusTime = 0;
      let distractionTime = 0;
      
      todayVisits.forEach(visit => {
        const category = categories[visit.domain] || 'neutral';
        if (category === 'focus') {
          focusTime += visit.duration;
        } else if (category === 'distraction') {
          distractionTime += visit.duration;
        }
      });
      
      // Update UI
      document.getElementById('focus-time').textContent = 
        Math.round(focusTime / 60) + 'm';
      document.getElementById('distraction-time').textContent = 
        Math.round(distractionTime / 60) + 'm';
    });
  });
}
// options.js - Settings page for Intent
console.log('⚙️ Options page loaded');

// Default settings
const DEFAULTS = {
  categories: {
    'facebook.com': 'distraction',
    'www.facebook.com': 'distraction',
    'twitter.com': 'distraction',
    'www.twitter.com': 'distraction',
    'instagram.com': 'distraction',
    'www.instagram.com': 'distraction',
    'reddit.com': 'distraction',
    'www.reddit.com': 'distraction',
    'tiktok.com': 'distraction',
    'www.tiktok.com': 'distraction',
    'youtube.com': 'neutral',
    'www.youtube.com': 'neutral',
    'github.com': 'focus',
    'www.github.com': 'focus',
    'stackoverflow.com': 'focus',
    'www.stackoverflow.com': 'focus',
    'medium.com': 'neutral',
    'www.medium.com': 'neutral',
    'docs.google.com': 'focus'
  },
  mindfulAccessEnabled: true,
  mindfulDelaySeconds: 5,
  snoozeDuration: 30,
  showStatsInPopup: true
};

// Current settings
let currentSettings = { ...DEFAULTS };

// DOM elements
const tabs = document.querySelectorAll('.tab-button');
const sitesList = document.getElementById('sites-list');
const siteSearch = document.getElementById('site-search');
const newSite = document.getElementById('new-site');
const newCategory = document.getElementById('new-category');
const addSiteBtn = document.getElementById('add-site-btn');
const mindfulEnabled = document.getElementById('mindful-enabled');
const modalDelay = document.getElementById('modal-delay');
const snoozeDuration = document.getElementById('snooze-duration');
const showStats = document.getElementById('show-stats');
const saveBtn = document.getElementById('save-settings');
const resetBtn = document.getElementById('reset-defaults');
const exportBtn = document.getElementById('export-data');
const importBtn = document.getElementById('import-data');
const importFile = document.getElementById('import-file');
const resetDataBtn = document.getElementById('reset-data');
const dataPreview = document.getElementById('data-preview');
const statusDiv = document.getElementById('status-message');

// Load settings on startup
loadSettings();

// Tab switching
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tab.dataset.tab}-tab`).classList.add('active');
  });
});

// Load settings from storage
function loadSettings() {
  chrome.storage.local.get(['settings'], (result) => {
    if (result.settings) {
      currentSettings = {
        ...DEFAULTS,
        ...result.settings
      };
    }
    updateUI();
  });
}

// Update UI with current settings
function updateUI() {
  // Update checkboxes and inputs
  mindfulEnabled.checked = currentSettings.mindfulAccessEnabled;
  modalDelay.value = currentSettings.mindfulDelaySeconds;
  snoozeDuration.value = currentSettings.snoozeDuration;
  showStats.checked = currentSettings.showStatsInPopup !== false;
  
  // Render sites list
  renderSitesList();
  
  // Update preview
  updatePreview();
}

// Render sites list
function renderSitesList() {
  const sites = Object.entries(currentSettings.categories)
    .sort(([a], [b]) => a.localeCompare(b));
  
  sitesList.innerHTML = sites.map(([domain, category]) => `
    <div class="site-item" data-domain="${domain}">
      <span class="site-domain">${domain}</span>
      <div class="site-category">
        <select class="category-select ${category}" data-domain="${domain}">
          <option value="distraction" ${category === 'distraction' ? 'selected' : ''}>🚫 Distraction</option>
          <option value="focus" ${category === 'focus' ? 'selected' : ''}>🎯 Focus</option>
          <option value="neutral" ${category === 'neutral' ? 'selected' : ''}>⚪ Neutral</option>
        </select>
      </div>
      <button class="delete-site" data-domain="${domain}">🗑️</button>
    </div>
  `).join('');
  
  // Add event listeners to selects
  document.querySelectorAll('.category-select').forEach(select => {
    select.addEventListener('change', (e) => {
      const domain = e.target.dataset.domain;
      currentSettings.categories[domain] = e.target.value;
      updatePreview();
    });
  });
  
  // Add event listeners to delete buttons
  document.querySelectorAll('.delete-site').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const domain = e.target.dataset.domain;
      delete currentSettings.categories[domain];
      renderSitesList();
      updatePreview();
    });
  });
}

// Filter sites based on search
siteSearch.addEventListener('input', (e) => {
  const search = e.target.value.toLowerCase();
  document.querySelectorAll('.site-item').forEach(item => {
    const domain = item.dataset.domain.toLowerCase();
    item.style.display = domain.includes(search) ? 'flex' : 'none';
  });
});

// Add new site
addSiteBtn.addEventListener('click', () => {
  const domain = newSite.value.trim().toLowerCase();
  const category = newCategory.value;
  
  if (!domain) {
    showStatus('Please enter a domain', 'error');
    return;
  }
  
  // Simple validation
  if (domain.includes('http') || domain.includes('/')) {
    showStatus('Enter domain only (e.g., facebook.com)', 'error');
    return;
  }
  
  currentSettings.categories[domain] = category;
  renderSitesList();
  updatePreview();
  
  newSite.value = '';
  showStatus(`Added ${domain} as ${category}`, 'success');
});

// Save settings
saveBtn.addEventListener('click', () => {
  // Update settings from form
  currentSettings.mindfulAccessEnabled = mindfulEnabled.checked;
  currentSettings.mindfulDelaySeconds = parseInt(modalDelay.value);
  currentSettings.snoozeDuration = parseInt(snoozeDuration.value);
  currentSettings.showStatsInPopup = showStats.checked;
  
  // Save to storage
  chrome.storage.local.set({ settings: currentSettings }, () => {
    showStatus('Settings saved successfully!', 'success');
    updatePreview();
  });
});

// Reset to defaults
resetBtn.addEventListener('click', () => {
  if (confirm('Reset all settings to defaults?')) {
    currentSettings = { ...DEFAULTS };
    chrome.storage.local.set({ settings: currentSettings }, () => {
      updateUI();
      showStatus('Reset to defaults', 'success');
    });
  }
});

// Export settings
exportBtn.addEventListener('click', () => {
  const dataStr = JSON.stringify(currentSettings, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = `intent-settings-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
  showStatus('Settings exported', 'success');
});

// Import settings
importBtn.addEventListener('click', () => {
  importFile.click();
});

importFile.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const imported = JSON.parse(e.target.result);
      currentSettings = { ...DEFAULTS, ...imported };
      chrome.storage.local.set({ settings: currentSettings }, () => {
        updateUI();
        showStatus('Settings imported successfully!', 'success');
      });
    } catch (err) {
      showStatus('Invalid settings file', 'error');
    }
  };
  reader.readAsText(file);
  
  // Clear input
  importFile.value = '';
});

// Reset all data
resetDataBtn.addEventListener('click', () => {
  if (confirm('⚠️ This will delete ALL your settings and data. Are you sure?')) {
    chrome.storage.local.clear(() => {
      currentSettings = { ...DEFAULTS };
      updateUI();
      showStatus('All data cleared', 'success');
    });
  }
});

// Update preview
function updatePreview() {
  dataPreview.textContent = JSON.stringify(currentSettings, null, 2);
}

// Show status message
function showStatus(message, type) {
  statusDiv.textContent = message;
  statusDiv.className = `status ${type}`;
  
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}

// Feedback link
document.getElementById('feedback-link').addEventListener('click', (e) => {
  e.preventDefault();
  window.open('mailto:?subject=Intent%20Feedback');
});
document.addEventListener('DOMContentLoaded', function() {
  const saveButton = document.getElementById('save');
  const status = document.getElementById('status');

  saveButton.addEventListener('click', function() {
    chrome.storage.sync.set({}, function() {
      status.textContent = 'Options saved.';
      setTimeout(() => status.textContent = '', 750);
    });
  });
});
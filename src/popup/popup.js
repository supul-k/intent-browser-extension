document.addEventListener("DOMContentLoaded", () => {
  loadTodayStats();
  loadCurrentIntention();

  // Set intention button
  // In popup.js
  document.getElementById("set-intention").addEventListener("click", () => {
    const intention = document.getElementById("intention-input").value;
    console.log("🎯 Set button clicked, intention:", intention);

    if (intention) {
      chrome.runtime.sendMessage(
        { type: "SET_INTENTION", intention: intention },
        (response) => {
          console.log("📨 Background response:", response);
          if (response?.success) {
            document.getElementById("intention-input").value = "";
            document.getElementById("current-intention-display").textContent =
              intention;
            showStatus("Intention set!", "success");
          }
        },
      );
    } else {
      console.log("⚠️ No intention entered");
    }
  });

  // Quick intentions
  document.querySelectorAll(".quick-intention").forEach((btn) => {
    btn.addEventListener("click", () => {
      const intention = btn.dataset.intention;
      chrome.runtime.sendMessage(
        { type: "SET_INTENTION", intention: intention },
        () => {
          document.getElementById("current-intention-display").textContent =
            intention;
        },
      );
    });
  });

  // Open options
  document.getElementById("open-options").addEventListener("click", (e) => {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
  });

  // Refresh stats
  document
    .getElementById("refresh-stats")
    .addEventListener("click", loadTodayStats);
});

function loadTodayStats() {
  chrome.runtime.sendMessage({ type: "GET_TODAY_STATS" }, (stats) => {
    if (stats) {
      document.getElementById("focus-time").textContent =
        Math.round(stats.focusTime / 60) + "m";
      document.getElementById("distraction-time").textContent =
        Math.round(stats.distractionTime / 60) + "m";
      document.getElementById("interruptions").textContent =
        stats.interruptions;
      document.getElementById("resisted").textContent = stats.resisted;
    }
  });
}

function loadCurrentIntention() {
  chrome.storage.local.get(["currentIntention"], (result) => {
    if (result.currentIntention) {
      document.getElementById("current-intention-display").textContent =
        result.currentIntention;
    }
  });
}

function showStatus(message, type) {
  const status = document.getElementById("status-message");
  status.textContent = message;
  status.className = `status ${type}`;
  status.style.display = "block";

  setTimeout(() => {
    status.style.display = "none";
  }, 2000);
}

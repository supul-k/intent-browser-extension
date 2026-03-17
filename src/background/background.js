// background.js - Clean version with import
import db from './database.js';

// Initialize database
db.init().then(() => {
  console.log('✅ Database ready');
});

// Store current intention
let currentIntention = null;
let currentTabId = null;
let currentDomain = null;
let startTime = null;
let snoozedDomains = {};

// Rest of your background.js code (same as above, but remove the db object definition)
// ... (copy everything from the simple version after the db object)
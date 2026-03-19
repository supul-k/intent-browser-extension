// database.js - Full IndexedDB implementation
export class IntentDatabase {
  constructor() {
    this.dbName = 'IntentDB';
    this.dbVersion = 1;
    this.db = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('✅ IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('visits')) {
          const visitStore = db.createObjectStore('visits', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          visitStore.createIndex('timestamp', 'timestamp', { unique: false });
          visitStore.createIndex('domain', 'domain', { unique: false });
          visitStore.createIndex('date', 'date', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('intentions')) {
          const intentionStore = db.createObjectStore('intentions', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          intentionStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('actions')) {
          const actionStore = db.createObjectStore('actions', { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          actionStore.createIndex('timestamp', 'timestamp', { unique: false });
          actionStore.createIndex('domain', 'domain', { unique: false });
        }
      };
    });
  }

  async addVisit(visit) {
    const visitData = {
      ...visit,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    };
    return this.add('visits', visitData);
  }

  async addIntention(intention) {
    return this.add('intentions', {
      intention,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    });
  }

  async addAction(action) {
    return this.add('actions', {
      ...action,
      timestamp: Date.now(),
      date: new Date().toISOString().split('T')[0]
    });
  }

  async add(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getVisits(startDate, endDate) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['visits'], 'readonly');
      const store = transaction.objectStore('visits');
      const index = store.index('timestamp');
      
      const range = IDBKeyRange.bound(startDate, endDate);
      const request = index.getAll(range);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll(storeName, startTime, endTime) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index('timestamp');
      
      const range = IDBKeyRange.bound(startTime, endTime);
      const request = index.getAll(range);
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async getTodaySummary() {
    const startOfDay = new Date().setHours(0, 0, 0, 0);
    const endOfDay = new Date().setHours(23, 59, 59, 999);
    
    const [visits, actions, intentions] = await Promise.all([
      this.getVisits(startOfDay, endOfDay),
      this.getAll('actions', startOfDay, endOfDay),
      this.getAll('intentions', startOfDay, endOfDay)
    ]);
    
    const settings = await this.getSettings();
    const categories = settings?.categories || {};
    
    const stats = {
      totalTime: 0,
      focusTime: 0,
      distractionTime: 0,
      neutralTime: 0,
      interruptions: actions.length,
      intentions: intentions.length,
      topSites: []
    };
    
    const domainStats = {};
    
    visits.forEach(visit => {
      stats.totalTime += visit.duration;
      
      const category = categories[visit.domain] || 'neutral';
      if (category === 'focus') stats.focusTime += visit.duration;
      if (category === 'distraction') stats.distractionTime += visit.duration;
      if (category === 'neutral') stats.neutralTime += visit.duration;
      
      if (!domainStats[visit.domain]) {
        domainStats[visit.domain] = {
          domain: visit.domain,
          totalTime: 0,
          category
        };
      }
      domainStats[visit.domain].totalTime += visit.duration;
    });
    
    stats.topSites = Object.values(domainStats)
      .sort((a, b) => b.totalTime - a.totalTime)
      .slice(0, 5);
    
    return stats;
  }

  async getSettings() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['settings'], (result) => {
        resolve(result.settings);
      });
    });
  }
}

// Export a singleton instance
const db = new IntentDatabase();
export default db;
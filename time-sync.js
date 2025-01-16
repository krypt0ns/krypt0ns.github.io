let serverTimeOffset = 0;
let lastSyncTime = 0;
const SYNC_INTERVAL = 5 * 60 * 1000; // Sync every 5 minutes

export async function initializeTimeSync(db) {
    await syncTime(db);
    // Periodically sync time
    setInterval(() => syncTime(db), SYNC_INTERVAL);
}

async function syncTime(db) {
    try {
        const startTime = Date.now();
        const timeDoc = await db.collection('_system').doc('time').get();
        const endTime = Date.now();
        const roundTripTime = endTime - startTime;
        
        // Get server timestamp
        const serverTime = timeDoc.data().timestamp.toMillis();
        
        // Calculate offset considering network latency
        const estimatedServerTime = serverTime + (roundTripTime / 2);
        serverTimeOffset = estimatedServerTime - Date.now();
        lastSyncTime = Date.now();
        
        console.log('Time synchronized. Offset:', serverTimeOffset);
    } catch (error) {
        console.error('Error syncing time:', error);
    }
}

export function getServerTime() {
    return Date.now() + serverTimeOffset;
} 
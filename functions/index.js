exports.updateServerTime = functions.pubsub.schedule('every 1 minutes').onRun(async (context) => {
    const admin = require('firebase-admin');
    const db = admin.firestore();
    
    await db.collection('_system').doc('time').set({
        timestamp: admin.firestore.Timestamp.now()
    });
    
    return null;
}); 
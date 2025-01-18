// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDvG4059xSr2jToP9xDz-8dlxbumuRzdUE",
    authDomain: "sdfkj238j98sdlkmzlknslaksdjfkl.firebaseapp.com",
    projectId: "sdfkj238j98sdlkmzlknslaksdjfkl",
    storageBucket: "sdfkj238j98sdlkmzlknslaksdjfkl.applestorage.com",
    messagingSenderId: "778178162130",
    appId: "1:778178162130:web:a9513f09e404813aa2ec0b",
    measurementId: "G-WP6QR49WZ3"
};

// Initialize Firebase if not already initialized
let firebaseApp;
try {
    firebaseApp = firebase.initializeApp(firebaseConfig);
} catch {
    console.error('Firebase already initialized');
}

// Validate stored credentials
export async function validateStoredCredentials() {
    const username = localStorage.getItem('currentUser');
    const password = localStorage.getItem('userPassword');

    if (!username || !password) {
        return false;
    }

    try {
        const userDoc = await db.collection('users').doc(username).get();
        if (!userDoc.exists) {
            return false;
        }

        const userData = userDoc.data();
        return userData.password === password;
    } catch (error) {
        console.error('Error validating credentials:', error);
        return false;
    }
}

// Check for IP ban
export async function checkIPBan() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const ip = data.ip;

        const banDoc = await db.collection('banned_ips').doc(ip).get();
        if (banDoc.exists) {
            window.location.href = '/banned/';
            return true;
        }
        return false;
    } catch (error) {
        console.error('Error checking IP ban:', error);
        return false;
    }
}

// Export other auth-related functions as needed
export function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userPassword');
    window.location.href = '/login/';
}
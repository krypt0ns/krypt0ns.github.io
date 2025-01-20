// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js';

// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDvG4059xSr2jToP9xDz-8dlxbumuRzdUE",
    authDomain: "sdfkj238j98sdlkmzlknslaksdjfkl.firebaseapp.com",
    projectId: "sdfkj238j98sdlkmzlknslaksdjfkl",
    storageBucket: "sdfkj238j98sdlkmzlknslaksdjfkl.applestorage.com",
    messagingSenderId: "778178162130",
    appId: "1:778178162130:web:a9513f09e404813aa2ec0b",
    measurementId: "G-WP6QR49WZ3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth();

// Initialize Firebase App Check
const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6Lfd2b0qAAAAAC1BlqG1RMQ_Y8iPJt79qanPkIgT'),
    isTokenAutoRefreshEnabled: true
});

// Function to check current user
function checkCurrentUser() {
    const user = auth.currentUser;  // Get current user
    if (user) {
        console.log('User is logged in:', user);
        return user;
    } else {
        console.log('No user is logged in');
        return null;
    }
}

// Function to check IP ban
async function checkIPBan() {
    console.log('Checking IP ban...');
    try {
        // Get client IP
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const clientIP = data.ip;
        console.log('Current IP:', clientIP);

        // Check if IP is banned
        const ipBanDoc = await getDoc(doc(db, 'ipbans', clientIP));
        if (ipBanDoc.exists()) {
            console.log('IP is banned');
            return true;
        } else {
            console.log('IP is not banned');
            return false;
        }
    } catch (error) {
        console.error('Error checking IP ban:', error);
        return false;
    }
}

// Function to sign-in with email and password
async function signInUser(email, password) {
    try {
        // Check IP ban before attempting login
        const isBanned = await checkIPBan();
        if (isBanned) {
            throw new Error('Your IP is banned');
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Logged in as:", user.email);
        return user;
    } catch (error) {
        console.error("Error during login:", error.code, error.message);
        throw error; // Re-throw the error to handle it in the calling code
    }
}

// Function to get App Check Token
async function getAppCheckToken() {
    try {
        const token = await appCheck.getToken(true);
        console.log('App Check Token:', token);
        return token;
    } catch (error) {
        console.error('Error getting App Check token:', error);
        throw error;
    }
}

// Export functions for use in other files
export {
    checkCurrentUser,
    signInUser,
    getAppCheckToken,
    checkIPBan,
    auth,
    db
};

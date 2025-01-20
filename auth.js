// Firebase imports (if using modules)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, doc, getDoc, collection } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

// Firebase config (replace with your config)
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

// Add custom settings to ensure proper origin/referer
const firestore = getFirestore(app);
firestore.settings({
    experimentalForceLongPolling: true, // Helps with some browser compatibility
    host: 'firestore.googleapis.com',
    ssl: true,
    headers: {
        'Referer': 'https://www.krypt0n.net'
    }
});

/**
 * Enhanced error handling for Firestore operations
 * @param {Error} error - The error object
 * @returns {string} User-friendly error message
 */
function handleFirestoreError(error) {
    console.error('Firestore error:', error);
    
    if (error.code === 'permission-denied') {
        if (window.location.hostname !== 'www.krypt0n.net' && 
            window.location.hostname !== 'krypt0n.net') {
            return 'Access denied: Invalid domain';
        }
        return 'Access denied: Please check your permissions';
    }
    
    return error.message;
}

/**
 * Validates stored credentials against Firestore with enhanced error handling
 * @returns {Promise<boolean>} True if credentials are valid
 */
async function validateStoredCredentials() {
    const username = localStorage.getItem('currentUser');
    const password = localStorage.getItem('userPassword');

    if (!username || !password) {
        redirectToLogin();
        return false;
    }

    try {
        const userDoc = await getDoc(doc(db, 'users', username));
        const userData = userDoc.data();

        if (!userDoc.exists() || !userData || userData.password !== password) {
            console.error('Invalid credentials');
            redirectToLogin();
            return false;
        }

        return true;
    } catch (error) {
        const errorMessage = handleFirestoreError(error);
        console.error('Auth error:', errorMessage);
        
        if (errorMessage.includes('Invalid domain')) {
            window.location.href = 'https://www.krypt0n.net/login/';
            return false;
        }
        
        redirectToLogin();
        return false;
    }
}

/**
 * Redirects to login page and handles cleanup
 */
function redirectToLogin() {
    // Clear credentials
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userPassword');
    
    // Save current URL for post-login redirect
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    
    // Redirect to login page
    window.location.href = '/login/';
}

/**
 * Logs out the current user
 */
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userPassword');
    redirectToLogin();
}

/**
 * Checks if user has admin privileges
 * @returns {Promise<boolean>} True if user is admin
 */
async function isAdmin() {
    const username = localStorage.getItem('currentUser');
    if (!username) return false;

    try {
        const userDoc = await getDoc(doc(db, 'users', username));
        const userData = userDoc.data();
        return userData?.isAdmin === true;
    } catch (error) {
        console.error('Admin check error:', error);
        return false;
    }
}

/**
 * Gets current user data
 * @returns {Promise<Object|null>} User data or null if not logged in
 */
async function getCurrentUser() {
    const username = localStorage.getItem('currentUser');
    if (!username) return null;

    try {
        const userDoc = await getDoc(doc(db, 'users', username));
        return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

/**
 * Validates that the current domain is correct
 * @returns {boolean} True if domain is valid
 */
function validateDomain() {
    const validDomains = ['www.krypt0n.net', 'krypt0n.net'];
    const currentDomain = window.location.hostname;
    
    if (!validDomains.includes(currentDomain)) {
        window.location.href = 'https://www.krypt0n.net';
        return false;
    }
    return true;
}

/**
 * Sets up authentication listeners
 */
function setupAuthListeners() {
    if (!validateDomain()) return;

    // Listen for storage changes (logout from other tabs)
    window.addEventListener('storage', async (e) => {
        if (e.key === 'currentUser' || e.key === 'userPassword') {
            const isValid = await validateStoredCredentials();
            if (!isValid) {
                redirectToLogin();
            }
        }
    });

    // Periodic validation (optional, every 5 minutes)
    setInterval(async () => {
        const isValid = await validateStoredCredentials();
        if (!isValid) {
            redirectToLogin();
        }
    }, 5 * 60 * 1000);
}

// Add this function to check IP bans
async function checkIPBan() {
    // Validate domain first
    if (window.location.hostname !== 'www.krypt0n.net' && 
        window.location.hostname !== 'krypt0n.net') {
        window.location.href = 'https://www.krypt0n.net';
        return true;
    }

    try {
        console.log('Checking IP ban...');
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const currentIP = data.ip;
        console.log('Current IP:', currentIP);

        try {
            const banDoc = await getDoc(doc(db, 'ipbans', currentIP));
            if (banDoc.exists()) {
                const banData = banDoc.data();
                console.log('IP is banned:', banData);
                localStorage.removeItem('currentUser');
                localStorage.removeItem('userPassword');
                
                // Redirect to banned page with reason
                window.location.href = 'https://www.krypt0n.net/banned/?reason=banned';
                return true;
            }
            console.log('IP is not banned');
            return false;
        } catch (error) {
            const errorMessage = handleFirestoreError(error);
            if (errorMessage.includes('Invalid domain')) {
                window.location.href = 'https://www.krypt0n.net';
                return true;
            }
            throw error;
        }
    } catch (error) {
        console.error('Error checking IP ban:', error);
        return false;
    }
}

// Export functions
export {
    validateStoredCredentials,
    redirectToLogin,
    logout,
    isAdmin,
    getCurrentUser,
    setupAuthListeners,
    checkIPBan,
    validateDomain
};
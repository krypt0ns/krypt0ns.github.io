// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

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

/**
 * Validates stored credentials against Firestore
 * @returns {Promise<boolean>} True if credentials are valid
 */
export async function validateStoredCredentials() {
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

        // Check if account is banned
        if (userData.status === 'Banned') {
            // Show ban message and clear credentials
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userPassword');
            
            // Show ban message
            document.body.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #0f0f0f;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-family: Arial, sans-serif;
                ">
                    <div style="
                        background: rgba(255, 0, 0, 0.1);
                        border: 1px solid rgba(255, 0, 0, 0.2);
                        padding: 2rem;
                        border-radius: 12px;
                        text-align: center;
                        max-width: 80%;
                    ">
                        <i class="fas fa-ban" style="
                            font-size: 3rem;
                            color: #ff0000;
                            margin-bottom: 1rem;
                        "></i>
                        <h2 style="margin-bottom: 1rem;">Access Denied</h2>
                        <p style="margin-bottom: 1rem;">Your account has been banned.</p>
                        ${userData.banReason ? `<p style="color: #ff6b6b;">Reason: ${userData.banReason}</p>` : ''}
                    </div>
                </div>
            `;
            return false;
        }

        return true;
    } catch (error) {
        console.error('Auth error:', error);
        redirectToLogin();
        return false;
    }
}

/**
 * Redirects to login page and handles cleanup
 */
export function redirectToLogin() {
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
export function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userPassword');
    redirectToLogin();
}

/**
 * Checks if user has admin privileges
 * @returns {Promise<boolean>} True if user is admin
 */
export async function isAdmin() {
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
export async function getCurrentUser() {
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
 * Sets up authentication listeners
 */
export function setupAuthListeners() {
    // Listen for storage changes (logout from other tabs)
    window.addEventListener('storage', async (e) => {
        if (e.key === 'currentUser' || e.key === 'userPassword') {
            const isValid = await validateStoredCredentials();
            if (!isValid) {
                redirectToLogin();
            }
        }
    });

    // Periodic validation
    setInterval(async () => {
        const isValid = await validateStoredCredentials();
        if (!isValid) {
            redirectToLogin();
        }
    }, 5 * 60 * 1000);
}

/**
 * Checks if IP is banned
 * @returns {Promise<boolean>} True if IP is banned
 */
export async function checkIPBan() {
    try {
        // Get current IP
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const currentIP = data.ip;

        // Check if IP is banned
        const banDoc = await getDoc(doc(db, 'ipbans', currentIP));
        if (banDoc.exists()) {
            const banData = banDoc.data();
            // Clear any stored credentials
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userPassword');
            
            // Show ban message
            document.body.innerHTML = `
                <div style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: #0f0f0f;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-family: Arial, sans-serif;
                ">
                    <div style="
                        background: rgba(255, 0, 0, 0.1);
                        border: 1px solid rgba(255, 0, 0, 0.2);
                        padding: 2rem;
                        border-radius: 12px;
                        text-align: center;
                        max-width: 80%;
                    ">
                        <i class="fas fa-ban" style="
                            font-size: 3rem;
                            color: #ff0000;
                            margin-bottom: 1rem;
                        "></i>
                        <h2 style="margin-bottom: 1rem;">Access Denied</h2>
                        <p style="margin-bottom: 1rem;">Your account has been banned.</p>
                        ${banData.reason ? `<p style="color: #ff6b6b;">Reason: ${banData.reason}</p>` : ''}
                    </div>
                </div>
            `;
            return true; // IP is banned
        }
        return false; // IP is not banned
    } catch (error) {
        console.error('Error checking IP ban:', error);
        return false;
    }
}

/**
 * Checks if a username is banned
 * @param {string} username Username to check
 * @returns {Promise<boolean>} True if username is banned
 */
export async function isUsernameBanned(username) {
    try {
        const userDoc = await getDoc(doc(db, 'users', username));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            return userData.banned === true;
        }
        return false;
    } catch (error) {
        console.error('Error checking username ban:', error);
        return false;
    }
}

// Export the db instance for use in other files
export { db };
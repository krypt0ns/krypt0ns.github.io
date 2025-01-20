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

// Initialize App Check with reCAPTCHA
const appCheck = initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6Lfd2b0qAAAAAC1BlqG1RMQ_Y8iPJt79qanPkIgT'), // reCAPTCHA v3 site key
    isTokenAutoRefreshEnabled: true
});

// Function to check the current user
function checkCurrentUser() {
    const user = auth.currentUser;  // Get current user
    if (user) {
        console.log('User is logged in:', user);
    } else {
        console.log('No user is logged in');
    }
}

// Function to sign in with email and password
async function signInUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Logged in as:", user.email);
    } catch (error) {
        console.error("Error during login:", error.code, error.message);
    }
}

// Function to get App Check token
async function getAppCheckToken() {
    try {
        const token = await appCheck.getToken(true); // Get token with force refresh
        console.log('App Check Token:', token);
    } catch (error) {
        console.error('Error getting App Check token:', error);
    }
}

// Example function to validate credentials against Firestore
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
        console.error('Auth error:', error);
        redirectToLogin();
        return false;
    }
}

// Function to redirect to login page
function redirectToLogin() {
    // Clear credentials
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userPassword');
    
    // Save current URL for post-login redirect
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    
    // Redirect to login page
    window.location.href = '/login/';
}

// Function to log out the user
function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userPassword');
    redirectToLogin();
}

// Function to check if user is an admin
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

// Function to get current user data
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

// Function to check IP bans (if you want to add IP ban functionality)
async function checkIPBan() {
    try {
        console.log('Checking IP ban...');
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const currentIP = data.ip;
        console.log('Current IP:', currentIP);

        const banDoc = await getDoc(doc(db, 'ipbans', currentIP));
        if (banDoc.exists()) {
            const banData = banDoc.data();
            console.log('IP is banned:', banData);
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userPassword');
            
            // Redirect to banned page with reason
            window.location.href = '/banned/?reason=banned';
            return true; // IP is banned
        }
        console.log('IP is not banned');
        return false; // IP is not banned
    } catch (error) {
        console.error('Error checking IP ban:', error);
        return false;
    }
}

// Set up authentication listeners to check for session changes
function setupAuthListeners() {
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

// Export functions
export {
    validateStoredCredentials,
    redirectToLogin,
    logout,
    isAdmin,
    getCurrentUser,
    setupAuthListeners,
    checkIPBan,
    signInUser,
    checkCurrentUser,
    getAppCheckToken
};

// Firebase imports (if using modules)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

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
const auth = getAuth(app);

// Authentication listener to track login state
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User logged in:", user.email);
        localStorage.setItem('currentUser', user.email);  // Store logged-in user in local storage
    } else {
        console.log("No user is logged in.");
        localStorage.removeItem('currentUser');  // Remove user on logout
    }
});

/**
 * Validates stored credentials against Firebase Authentication
 * @returns {Promise<boolean>} True if credentials are valid
 */
async function validateStoredCredentials() {
    const user = auth.currentUser;  // Get the current authenticated user

    if (!user) {
        redirectToLogin();
        return false;
    }

    try {
        // Optionally, check additional Firestore user data if needed
        const userDoc = await getDoc(doc(db, 'users', user.email));
        const userData = userDoc.data();

        if (!userDoc.exists() || !userData) {
            console.error('Invalid user data in Firestore');
            redirectToLogin();
            return false;
        }

        return true;
    } catch (error) {
        console.error('Error validating user in Firestore:', error);
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
    
    // Save current URL for post-login redirect
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    
    // Redirect to login page
    window.location.href = '/login/';
}

/**
 * Logs out the current user
 */
function logout() {
    signOut(auth).then(() => {
        console.log("User logged out");
        localStorage.removeItem('currentUser');
        redirectToLogin();
    }).catch((error) => {
        console.error('Logout error:', error);
    });
}

/**
 * Checks if user has admin privileges
 * @returns {Promise<boolean>} True if user is admin
 */
async function isAdmin() {
    const user = auth.currentUser;  // Get current authenticated user
    if (!user) return false;

    try {
        const userDoc = await getDoc(doc(db, 'users', user.email));
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
    const user = auth.currentUser;  // Get current authenticated user
    if (!user) return null;

    try {
        const userDoc = await getDoc(doc(db, 'users', user.email));
        return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

/**
 * Sets up authentication listeners
 */
function setupAuthListeners() {
    // Listen for storage changes (logout from other tabs)
    window.addEventListener('storage', async (e) => {
        if (e.key === 'currentUser') {
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
    setupAuthListeners
};

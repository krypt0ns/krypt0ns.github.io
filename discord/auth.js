// Import Firebase functions
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

// Your Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyDvG4059xSr2jToP9xDz-8dlxbumuRzdUE",
    authDomain: "sdfkj238j98sdlkmzlknslaksdjfkl.firebaseapp.com", 
    projectId: "sdfkj238j98sdlkmzlknslaksdjfkl",
    storageBucket: "sdfkj238j98sdlkmzlknslaksdjfkl.firebasestorage.app",
    messagingSenderId: "778178162130",
    appId: "1:778178162130:web:a9513f09e404813aa2ec0b",
    measurementId: "G-WP6QR49WZ3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function validateStoredCredentials() {
    const username = localStorage.getItem('currentUser');
    const password = localStorage.getItem('userPassword');
    
    if (!username || !password) {
        localStorage.removeItem('currentUser'); // Clear username if either is missing
        localStorage.removeItem('userPassword'); // Clear password if either is missing
        redirectToLogin();
        return false;
    }

    try {
        const userRef = doc(db, "users", username);
        const userDoc = await getDoc(userRef);

        if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.password === password) {
                return true;
            }
        }
        // If password is wrong or user doesn't exist, clear credentials
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userPassword');
        redirectToLogin();
        return false;
    } catch (error) {
        console.error('Auth validation error:', error);
        // Also clear credentials on error
        localStorage.removeItem('currentUser');
        localStorage.removeItem('userPassword');
        redirectToLogin();
        return false;
    }
}

function redirectToLogin() {
    // Clear any stored credentials
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userPassword');
    
    // Save the current URL to redirect back after login
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
    
    // Redirect to login page
    window.location.href = '/index.html';
}

// Export functions
export { validateStoredCredentials, redirectToLogin };
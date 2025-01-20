import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';

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

// Authentication listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("User logged in:", user.email);
        localStorage.setItem('currentUser', user.email);  // Store logged-in user
    } else {
        console.log("No user is logged in.");
        localStorage.removeItem('currentUser');  // Remove user on logout
    }
});

// Validate stored credentials
async function validateStoredCredentials() {
    const user = auth.currentUser;  // Get the current authenticated user

    if (!user) {
        redirectToLogin();
        return false;
    }

    try {
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

// Redirects to login page
function redirectToLogin() {
    localStorage.removeItem('currentUser');
    window.location.href = '/login/';
}

// Sign-in function using email and password
async function signInUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Logged in as:", user.email);
    } catch (error) {
        console.error("Error during login:", error.code, error.message);
        redirectToLogin();
    }
}

// Check if user has admin privileges
async function isAdmin() {
    const user = auth.currentUser;
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

export {
    validateStoredCredentials,
    redirectToLogin,
    signInUser,
    isAdmin
};

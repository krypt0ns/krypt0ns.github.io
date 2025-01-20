// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { getAppCheck } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js';

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

// Example function to check current user
function checkCurrentUser() {
    const user = auth.currentUser;  // Get current user
    if (user) {
        console.log('User is logged in:', user);
    } else {
        console.log('No user is logged in');
    }
}

// Example function to sign-in with email and password
async function signInUser(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("Logged in as:", user.email);
    } catch (error) {
        console.error("Error during login:", error.code, error.message);
    }
}

// Example: Check App Check Token
async function getAppCheckToken() {
    const appCheck = getAppCheck();
    try {
        const token = await appCheck.getToken(true);
        console.log('App Check Token:', token);
    } catch (error) {
        console.error('Error getting App Check token:', error);
    }
}
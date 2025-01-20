// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js';

// Authorized domains
const AUTHORIZED_DOMAINS = [
    'krypt0n.net',
    'www.krypt0n.net',
    'localhost',
    '127.0.0.1'
];

// Domain verification
function verifyDomain() {
    const currentDomain = window.location.hostname;
    if (!AUTHORIZED_DOMAINS.includes(currentDomain)) {
        throw new Error('Unauthorized domain');
    }
    return true;
}

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

// Initialize Firebase with domain verification
let app, auth, db, appCheck;

try {
    if (!verifyDomain()) {
        throw new Error('Unauthorized domain');
    }

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Initialize App Check
    appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('6Lfd2b0qAAAAAC1BlqG1RMQ_Y8iPJt79qanPkIgT'),
        isTokenAutoRefreshEnabled: true
    });

    // Debug token for development
    if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
        self.FIREBASE_APPCHECK_DEBUG_TOKEN = true;
    }
} catch (error) {
    console.error('Firebase initialization error:', error);
    window.location.href = '/error.html';
}

// Authentication state observer with domain check
onAuthStateChanged(auth, (user) => {
    if (user) {
        try {
            verifyDomain();
            console.log("User logged in:", user.email);
            localStorage.setItem('currentUser', user.email);
        } catch (error) {
            console.error('Domain verification failed:', error);
            signOut(auth);
        }
    } else {
        console.log("No user is logged in");
        localStorage.removeItem('currentUser');
    }
});

// Check IP ban
async function checkIPBan() {
    if (!verifyDomain()) return false;
    
    console.log('Checking IP ban...');
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const clientIP = data.ip;
        console.log('Current IP:', clientIP);

        const ipBanDoc = await getDoc(doc(db, 'ipbans', clientIP));
        if (ipBanDoc.exists()) {
            console.log('IP is banned');
            const banData = ipBanDoc.data();
            window.location.href = `/banned/?reason=${encodeURIComponent(banData.reason || 'banned')}`;
            return true;
        }
        console.log('IP is not banned');
        return false;
    } catch (error) {
        console.error('Error checking IP ban:', error);
        return false;
    }
}

// Sign in user with domain verification
async function signInUser(email, password) {
    if (!verifyDomain()) {
        throw new Error('Unauthorized domain');
    }

    try {
        const isBanned = await checkIPBan();
        if (isBanned) {
            throw new Error('Your IP is banned');
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update last login
        await setDoc(doc(db, 'users', user.uid), {
            lastLogin: serverTimestamp(),
            email: user.email,
            domain: window.location.hostname
        }, { merge: true });

        return user;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}

// Sign out user
async function signOutUser() {
    try {
        await signOut(auth);
        localStorage.removeItem('currentUser');
        window.location.href = '/login/';
    } catch (error) {
        console.error("Sign out error:", error);
        throw error;
    }
}

// Export functions
export {
    checkIPBan,
    signInUser,
    signOutUser,
    verifyDomain,
    auth,
    db
};
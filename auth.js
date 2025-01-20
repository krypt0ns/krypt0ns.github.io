// Firebase imports
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';
import { initializeAppCheck, ReCaptchaV3Provider } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app-check.js';

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

// Origin verification function
function verifyOrigin() {
    const allowedOrigins = [
        'https://krypt0n.net',
        'https://www.krypt0n.net',
        'http://localhost:8080',
        'http://127.0.0.1:8080'
    ];

    if (!allowedOrigins.includes(window.location.origin)) {
        throw new Error('Unauthorized domain');
    }
}

// Initialize Firebase with security checks
let app, auth, db, appCheck;

try {
    verifyOrigin();
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Initialize Firebase App Check
    appCheck = initializeAppCheck(app, {
        provider: new ReCaptchaV3Provider('6Lfd2b0qAAAAAC1BlqG1RMQ_Y8iPJt79qanPkIgT'),
        isTokenAutoRefreshEnabled: true
    });

    // Add authentication state observer
    onAuthStateChanged(auth, (user) => {
        if (user) {
            console.log("User logged in:", user.email);
            localStorage.setItem('currentUser', user.email);
            
            // Force sign out if not on authorized domain
            if (!window.location.origin.includes('krypt0n.net') && 
                !window.location.origin.includes('localhost') && 
                !window.location.origin.includes('127.0.0.1')) {
                signOut(auth);
            }
        } else {
            console.log("No user is logged in.");
            localStorage.removeItem('currentUser');
        }
    });

} catch (error) {
    console.error('Authentication initialization error:', error);
    window.location.href = '/error.html';
}

// Function to check current user
function checkCurrentUser() {
    const user = auth.currentUser;
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
            const banData = ipBanDoc.data();
            window.location.href = `/banned/?reason=${encodeURIComponent(banData.reason || 'banned')}`;
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

// Function to sign in user
async function signInUser(email, password) {
    try {
        // Verify origin before attempting login
        verifyOrigin();

        // Check IP ban before attempting login
        const isBanned = await checkIPBan();
        if (isBanned) {
            throw new Error('Your IP is banned');
        }

        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Update user's last login and IP
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            await setDoc(doc(db, 'users', user.uid), {
                lastLogin: serverTimestamp(),
                lastIP: data.ip
            }, { merge: true });
        } catch (error) {
            console.error('Error updating user data:', error);
        }

        console.log("Logged in as:", user.email);
        return user;
    } catch (error) {
        console.error("Error during login:", error.code, error.message);
        throw error;
    }
}

// Function to sign out
async function signOutUser() {
    try {
        await signOut(auth);
        localStorage.removeItem('currentUser');
        window.location.href = '/login/';
    } catch (error) {
        console.error("Error signing out:", error);
        throw error;
    }
}

// Function to get App Check Token
async function getAppCheckToken() {
    try {
        const token = await appCheck.getToken(true);
        return token;
    } catch (error) {
        console.error('Error getting App Check token:', error);
        throw error;
    }
}

// Export functions and instances
export {
    checkCurrentUser,
    signInUser,
    signOutUser,
    getAppCheckToken,
    checkIPBan,
    auth,
    db
};

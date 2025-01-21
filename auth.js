import { supabase } from './config/supabase';

/**
 * Validates stored credentials against Supabase
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
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !user || user.password !== password) {
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
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
        return user?.isAdmin === true;
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
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();
        return user ? user : null;
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
export async function checkIPBan() {
    try {
        // Get current IP
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const currentIP = data.ip;

        // Check if IP is banned
        const { data: banData, error } = await supabase
            .from('ipbans')
            .select('*')
            .eq('ip', currentIP)
            .single();

        if (banData) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userPassword');
            window.location.href = '/banned.html';
            return true;
        }

        return false;
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
};
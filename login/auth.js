import { supabase } from '../config/supabase.js';

/**
 * Validates stored credentials against Supabase
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
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userPassword');
    localStorage.setItem('redirectAfterLogin', window.location.pathname);
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
            .select('isAdmin')
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

        return user || null;
    } catch (error) {
        console.error('Error getting user data:', error);
        return null;
    }
}

/**
 * Sets up authentication listeners
 */
function setupAuthListeners() {
    window.addEventListener('storage', async (e) => {
        if (e.key === 'currentUser' || e.key === 'userPassword') {
            const isValid = await validateStoredCredentials();
            if (!isValid) {
                redirectToLogin();
            }
        }
    });

    setInterval(async () => {
        const isValid = await validateStoredCredentials();
        if (!isValid) {
            redirectToLogin();
        }
    }, 5 * 60 * 1000);
}

/**
 * Checks if the current IP is banned
 * @returns {Promise<boolean>} True if IP is banned
 */
async function checkIPBan() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const currentIP = data.ip;

        const { data: banData, error } = await supabase
            .from('ipbans')
            .select('*')
            .eq('ip', currentIP)
            .single();

        if (banData) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userPassword');
            window.location.href = '/banned/?reason=banned';
            return true;
        }

        return false;
    } catch (error) {
        console.error('Error checking IP ban:', error);
        return false;
    }
}

export {
    validateStoredCredentials,
    redirectToLogin,
    logout,
    isAdmin,
    getCurrentUser,
    setupAuthListeners,
    checkIPBan
};
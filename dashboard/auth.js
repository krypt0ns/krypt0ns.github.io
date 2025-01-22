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
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error || !data || data.password !== password) {
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
        const { data, error } = await supabase
            .from('users')
            .select('is_admin')
            .eq('username', username)
            .single();

        return data?.is_admin === true;
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
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        return error ? null : data;
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

/**
 * Checks if IP is banned
 * @returns {Promise<boolean>} True if IP is banned
 */
async function checkIPBan() {
    try {
        console.log('Checking IP ban...');
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const currentIP = data.ip;
        console.log('Current IP:', currentIP);

        const { data: banData, error } = await supabase
            .from('ipbans')
            .select('*')
            .eq('ip', currentIP)
            .single();

        if (banData) {
            console.log('IP is banned:', banData);
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userPassword');
            window.location.href = '/banned.html';
            return true;
        }

        console.log('IP is not banned');
        return false;
    } catch (error) {
        console.error('Error checking IP ban:', error);
        return false;
    }
}

/**
 * Checks if the current IP matches the stored IP for the user
 * @returns {Promise<boolean>} True if IPs match, false otherwise
 */
async function checkIPMatch() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        const currentIP = data.ip;
        console.log('Current IP:', currentIP);

        const username = localStorage.getItem('currentUser');
        if (!username) {
            redirectToLogin();
            return false;
        }

        const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (userData) {
            // IP check disabled for now
            // if (userData.ip !== currentIP) {
            //     console.log('IP mismatch detected');
            //     localStorage.removeItem('currentUser');
            //     localStorage.removeItem('userPassword');
            //     window.location.href = '/banned.html';
            //     return false;
            // }
        }
        return true;
    } catch (error) {
        console.error('Error checking IP match:', error);
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
    checkIPBan,
    checkIPMatch
};
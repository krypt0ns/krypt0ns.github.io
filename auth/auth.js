import { supabase } from '../config/supabase.js';

export async function validateStoredCredentials() {
    const username = localStorage.getItem('currentUser');
    const password = localStorage.getItem('userPassword');

    if (!username || !password) {
        return false;
    }

    try {
        // Check if user exists and password matches
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .maybeSingle();

        if (error) throw error;
        
        if (!user || user.password !== password) {
            return false;
        }

        return true;
    } catch (error) {
        console.error('Auth error:', error);
        return false;
    }
}

export async function getCurrentUser() {
    const username = localStorage.getItem('currentUser');
    if (!username) return null;

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .maybeSingle();

        if (error) throw error;
        return user;
    } catch (error) {
        console.error('Error getting user:', error);
        return null;
    }
}

export function redirectToLogin() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userPassword');
    window.location.replace('/login/');
}

export async function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('userPassword');
    window.location.replace('/login/');
}

export async function isAdmin() {
    const user = await getCurrentUser();
    return user?.is_admin || false;
}

export async function setupAuthListeners() {
    window.addEventListener('storage', async (e) => {
        if (e.key === 'currentUser' || e.key === 'userPassword') {
            const isValid = await validateStoredCredentials();
            if (!isValid) {
                redirectToLogin();
            }
        }
    });
}

async function getCurrentIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error getting IP:', error);
        return null;
    }
}

export async function checkIPBan() {
    try {
        console.log('Checking IP ban...');
        const currentIP = await getCurrentIP();
        if (!currentIP) {
            console.error('Could not get IP address');
            return false;
        }
        console.log('Current IP:', currentIP);

        const { data: banData, error } = await supabase
            .from('ipbans')
            .select('*')
            .eq('ip', currentIP)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        if (banData) {
            console.log('IP is banned:', banData);
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userPassword');
            window.location.href = '/banned/?reason=banned';
            return true;
        }

        console.log('IP is not banned');
        return false;
    } catch (error) {
        console.error('IP ban check error:', error);
        return false;
    }
}
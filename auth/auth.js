import { supabase } from '../config/supabase.js';

export async function checkAuth() {
    const username = localStorage.getItem('currentUser');
    if (!username) {
        window.location.replace('/login/');
        return false;
    }

    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .maybeSingle();

        if (error || !user) {
            localStorage.removeItem('currentUser');
            localStorage.removeItem('userPassword');
            window.location.replace('/login/');
            return false;
        }

        return user;
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.replace('/login/');
        return false;
    }
}

export async function checkAdminAuth() {
    const user = await checkAuth();
    if (!user || !user.is_admin) {
        window.location.replace('/dashboard/');
        return false;
    }
    return user;
}

export async function checkIPBan() {
    try {
        const { data: ipBan, error } = await supabase
            .from('ip_bans')
            .select('*')
            .eq('ip', await getCurrentIP())
            .single();

        if (ipBan) {
            window.location.replace('/banned.html');
            return true;
        }
        return false;
    } catch (error) {
        console.error('IP ban check error:', error);
        return false;
    }
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
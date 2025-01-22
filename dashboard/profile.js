import { supabase } from '../config/supabase.js';

export async function loadUserProfile() {
    try {
        const username = localStorage.getItem('currentUser');
        if (!username) {
            console.error('No user logged in');
            return;
        }

        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('username', username)
            .single();

        if (error) throw error;

        // Update UI elements
        const balanceElement = document.querySelector('.balance-amount');
        if (balanceElement) {
            balanceElement.textContent = `$${user.balance?.toFixed(2) || '0.00'}`;
        }

        const profileImage = document.querySelector('.discord-pfp img');
        if (profileImage && user.avatar_url) {
            profileImage.src = user.avatar_url;
        }

    } catch (error) {
        console.error('Error loading user profile:', error);
        throw error;
    }
} 
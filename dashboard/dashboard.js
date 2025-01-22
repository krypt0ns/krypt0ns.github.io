import { supabase } from '../config/supabase.js';

// Define all functions first
async function loadListings() {
    try {
        const { data: listings, error } = await supabase
            .from('listings')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const listingsGrid = document.getElementById('listings-grid');
        if (!listingsGrid) return;

        if (!listings || listings.length === 0) {
            listingsGrid.innerHTML = `
                <div class="no-listings">
                    <i class="fas fa-store-slash"></i>
                    <p>No listings available</p>
                </div>
            `;
            return;
        }

        // Update grid class based on number of listings
        listingsGrid.className = 'listings-grid';
        if (listings.length === 1) {
            listingsGrid.classList.add('single-listing');
        } else if (listings.length === 2) {
            listingsGrid.classList.add('two-listings');
        }

        const listingCards = listings.map(listing => createListingCard(listing)).join('');
        listingsGrid.innerHTML = listingCards;

    } catch (error) {
        console.error('Error loading listings:', error);
        const listingsGrid = document.getElementById('listings-grid');
        if (listingsGrid) {
            listingsGrid.innerHTML = `
                <div class="error-state">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Error loading listings. Please try again later.</p>
                </div>
            `;
        }
    }
}

// Helper function to create listing card
function createListingCard(listing) {
    const status = listing.status?.toLowerCase() || 'unknown';
    const price = typeof listing.price === 'number' ? listing.price.toFixed(2) : '0.00';
    const date = listing.created_at ? new Date(listing.created_at).toLocaleDateString() : 'Unknown date';
    
    return `
        <div class="listing-card" data-id="${listing.id}">
            <div class="listing-header">
                <h3>${listing.title || 'Untitled'}</h3>
                <span class="price">$${price}</span>
            </div>
            <div class="listing-body">
                <p>${listing.description || 'No description available'}</p>
                <div class="listing-meta">
                    <span class="date">Posted: ${date}</span>
                    <span class="status ${status}">${listing.status || 'Unknown'}</span>
                </div>
            </div>
            <div class="listing-footer">
                <button onclick="handlePurchase('${listing.id}')" 
                        class="purchase-btn"
                        ${listing.status !== 'Active' ? 'disabled' : ''}>
                    ${listing.status === 'Active' ? 'Purchase' : 'Unavailable'}
                </button>
            </div>
        </div>
    `;
}

async function initializeListingListeners() {
    try {
        // Create the subscription
        const channel = supabase.channel('listings_changes');
        
        // Set up error handling before subscribing
        channel.on('error', (error) => {
            console.error('Subscription error:', error);
            showAlert('Error connecting to real-time updates', 'error');
        });

        // Subscribe to changes
        channel
            .on('postgres_changes', 
                { event: '*', schema: 'public', table: 'listings' },
                payload => {
                    loadListings(); // Reload listings on any change
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    console.log('Successfully subscribed to listings changes');
                }
            });

    } catch (error) {
        console.error('Error initializing listeners:', error);
        showAlert('Error initializing real-time updates', 'error');
    }
}

async function initializeDropScheduler() {
    console.log('Drop scheduler initialized');
    
    try {
        // Subscribe to changes on listings table
        const channel = supabase.channel('scheduled_drops')
            .on('postgres_changes', 
                { 
                    event: '*', 
                    schema: 'public', 
                    table: 'listings',
                    filter: 'drop_scheduled=eq.true AND is_locked=eq.true'
                },
                async (payload) => {
                    const listing = payload.new;
                    
                    // Get server time
                    const { data: serverTime } = await supabase.rpc('get_server_time');
                    const serverTimestamp = new Date(serverTime).getTime();
                    
                    // Check if it's time to drop
                    const dropTime = new Date(listing.drop_time).getTime();
                    if (dropTime && dropTime <= serverTimestamp) {
                        showDropAnimation(listing.id);
                        
                        // Update listing after animation
                        setTimeout(async () => {
                            try {
                                const { error } = await supabase
                                    .from('listings')
                                    .update({
                                        is_locked: false,
                                        drop_scheduled: false,
                                        status: 'Active',
                                        drop_time: serverTime,
                                        actual_drop_time: serverTime
                                    })
                                    .eq('id', listing.id);

                                if (error) throw error;
                            } catch (error) {
                                console.error('Error dropping listing:', error);
                            }
                        }, 3000);
                    }
                }
            )
            .subscribe();

    } catch (error) {
        console.error('Error initializing drop scheduler:', error);
    }
}

function showDropAnimation(listingId) {
    const listingCard = document.querySelector(`[data-id="${listingId}"]`);
    if (!listingCard) return;

    // Add loading overlay
    const overlay = document.createElement('div');
    overlay.className = 'drop-overlay';
    overlay.innerHTML = `
        <div class="drop-loader">
            <svg viewBox="25 25 50 50">
                <circle cx="50" cy="50" r="20"></circle>
            </svg>
            <div class="drop-status">
                <p class="sync-text">Synchronizing drop...</p>
                <p class="drop-text" style="display: none;">Dropping listing...</p>
            </div>
        </div>
    `;
    listingCard.appendChild(overlay);

    // Animation sequence
    setTimeout(() => {
        const syncText = overlay.querySelector('.sync-text');
        const dropText = overlay.querySelector('.drop-text');
        
        syncText.style.display = 'none';
        dropText.style.display = 'block';
        
        setTimeout(() => {
            overlay.remove();
            listingCard.classList.add('dropped');
            
            const button = listingCard.querySelector('.purchase-btn');
            if (button) {
                button.classList.remove('locked');
                button.disabled = false;
                button.textContent = 'Purchase Now';
            }
            
            const timer = listingCard.querySelector('.drop-timer');
            if (timer) timer.remove();
        }, 2000);
    }, 1000);
}

// Export functions that need to be accessed from index.html
export {
    loadListings,
    initializeListingListeners,
    initializeDropScheduler,
    showDropAnimation
};

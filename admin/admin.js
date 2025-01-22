// Add these imports at the top of admin.js
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Make db available globally
window.db = db;

// Add these functions to your admin.js file

// Function to load discount codes
async function loadDiscountCodes() {
    try {
        const discountSnapshot = await db.collection('discountCodes').get();
        const tableBody = document.getElementById('discount-codes-table');
        tableBody.innerHTML = '';

        for (const doc of discountSnapshot.docs) {
            const discount = doc.data();
            
            // Get usage count from discountUsages collection
            const usageCount = await db.collection('discountUsages')
                .where('discountCode', '==', discount.code)
                .get()
                .then(snapshot => snapshot.size);

            const expiryDate = discount.validUntil?.toDate() || new Date();
            const isExpired = expiryDate < new Date();
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${discount.code}</td>
                <td>${discount.percentage}%</td>
                <td>
                    <span class="discount-status ${isExpired ? 'status-expired' : 'status-active'}">
                        <i class="fas fa-${isExpired ? 'times-circle' : 'check-circle'}"></i>
                        ${isExpired ? 'Expired' : 'Active'}
                    </span>
                </td>
                <td>${usageCount} / ${discount.maxUses}</td>
                <td>${discount.maxUses}</td>
                <td>${expiryDate.toLocaleDateString()} ${expiryDate.toLocaleTimeString()}</td>
                <td>
                    <div class="discount-actions">
                        <button class="action-btn edit-btn" onclick="editDiscount('${doc.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteDiscount('${doc.id}')" title="Delete">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            `;
            
            tableBody.appendChild(row);
        }
    } catch (error) {
        console.error('Error loading discount codes:', error);
        showAlert('Error loading discount codes', 'error');
    }
}

// Make functions globally available
window.showAddDiscountModal = function() {
    const modal = document.getElementById('add-discount-modal');
    modal.style.display = 'flex';
    
    // Set minimum date to current date/time
    const dateInput = document.getElementById('expiry-date');
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(Date.now() - tzOffset)).toISOString().slice(0, 16);
    dateInput.min = localISOTime;
    dateInput.value = localISOTime;
};

window.closeAddDiscountModal = function() {
    const modal = document.getElementById('add-discount-modal');
    modal.style.display = 'none';
};

window.handleAddDiscount = async function(event) {
    event.preventDefault();
    
    const code = document.getElementById('discount-code').value.trim().toUpperCase();
    const percentage = parseInt(document.getElementById('discount-percentage').value);
    const maxUses = parseInt(document.getElementById('max-uses').value);
    const expiryDate = new Date(document.getElementById('expiry-date').value);

    try {
        // Check if code already exists
        const existingCode = await db.collection('discountCodes')
            .where('code', '==', code)
            .get();

        if (!existingCode.empty) {
            showAlert('Discount code already exists', 'error');
            return;
        }

        // Add new discount code
        await db.collection('discountCodes').add({
            code: code,
            percentage: percentage,
            maxUses: maxUses,
            currentUses: 0,
            active: true,
            validUntil: firebase.firestore.Timestamp.fromDate(expiryDate),
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        showAlert('Discount code created successfully', 'success');
        closeAddDiscountModal();
        loadDiscountCodes();
    } catch (error) {
        console.error('Error creating discount code:', error);
        showAlert('Error creating discount code', 'error');
    }
};

window.deleteDiscount = async function(discountId) {
    if (!confirm('Are you sure you want to delete this discount code?')) {
        return;
    }

    try {
        await db.collection('discountCodes').doc(discountId).delete();
        showAlert('Discount code deleted successfully', 'success');
        loadDiscountCodes();
    } catch (error) {
        console.error('Error deleting discount code:', error);
        showAlert('Error deleting discount code', 'error');
    }
};

window.editDiscount = async function(discountId) {
    showAlert('Edit functionality coming soon', 'info');
};

// Update the showSection function
window.showSection = function(sectionName, event) {
    // Hide all sections
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
    
    // Show the selected section
    const targetSection = document.getElementById(`${sectionName}-section`);
    if (targetSection) {
        targetSection.style.display = 'block';
    }
    
    // Initialize appropriate listener based on section
    if (sectionName === 'orders') {
        initializeOrdersListener();
    } else if (sectionName === 'listings') {
        initializeListingsListener();
    } else if (sectionName === 'users') {
        initializeUsersListener();
    } else if (sectionName === 'payments') {
        initializePaymentsListener();
    } else if (sectionName === 'discounts') {
        window.initializeDiscountsListener();
    }
    
    // Update active state in navigation
    if (event) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        event.target.classList.add('active');
    }
};

// Add initialization for discount section
function initializeDiscountSection() {
    const searchInput = document.getElementById('discount-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterDiscounts(searchTerm);
        });
    }
}

// Add function to filter discounts
function filterDiscounts(searchTerm) {
    const rows = document.querySelectorAll('#discount-codes-table tr');
    rows.forEach(row => {
        const code = row.querySelector('td:first-child')?.textContent.toLowerCase();
        if (code && code.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

// Update the initialization code
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all sections
    showSection('listings');
    
    // Add click handlers for menu items
    document.querySelectorAll('.sidebar-menu li').forEach(item => {
        item.addEventListener('click', (e) => {
            const section = item.dataset.section;
            showSection(section, e);
            
            // Update active state
            document.querySelectorAll('.sidebar-menu li').forEach(li => {
                li.classList.remove('active');
            });
            item.classList.add('active');
        });
    });
    
    // Initialize discount section
    initializeDiscountSection();
});

// Update the initialization function
window.initializeDiscountsListener = function() {
    loadDiscountCodes();
    
    const searchInput = document.getElementById('discount-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            filterDiscounts(searchTerm);
        });
    }
};

function createOrderCard(order) {
    // Calculate final price including discounts and fees
    const originalPrice = order.originalPrice || order.price;
    const discountAmount = order.appliedDiscount ? (originalPrice * order.appliedDiscount.percentage / 100) : 0;
    const subtotalAfterDiscount = originalPrice - discountAmount;
    
    // Fee rates based on payment method
    const feeRates = {
        cashapp: 0.05, // 5%
        paypal: 0.07,  // 7%
        crypto: 0,     // 0%
        balance: 0     // 0%
    };
    
    const feeRate = feeRates[order.paymentMethod] || 0;
    const feeAmount = subtotalAfterDiscount * feeRate;
    const totalPrice = subtotalAfterDiscount + feeAmount;

    return `
        <div class="order-card ${order.status.toLowerCase()}" data-order-id="${order.id}">
            <div class="order-header">
                <div class="user-info">
                    <img src="${order.userAvatar || 'https://cdn.discordapp.com/embed/avatars/0.png'}" alt="User Avatar">
                    <span>${order.username}</span>
                </div>
                <div class="order-status ${order.status.toLowerCase()}">${order.status}</div>
            </div>
            <div class="order-details">
                <div class="info-group">
                    <label>Order ID:</label>
                    <span>${order.orderNumber || order.id}</span>
                </div>
                <div class="info-group">
                    <label>Discord:</label>
                    <span>${order.discordUsername || 'N/A'}</span>
                </div>
                <div class="info-group">
                    <label>Product:</label>
                    <span>${order.listingTitle}</span>
                </div>
                <div class="info-group">
                    <label>Price Details:</label>
                    <div class="price-breakdown">
                        <div>Original Price: $${originalPrice.toFixed(2)}</div>
                        ${order.appliedDiscount ? `
                            <div class="discount">Discount (${order.appliedDiscount.percentage}%): -$${discountAmount.toFixed(2)}</div>
                        ` : ''}
                        ${feeRate > 0 ? `
                            <div>Fee (${(feeRate * 100)}%): +$${feeAmount.toFixed(2)}</div>
                        ` : ''}
                        <div class="total-price">Total: $${totalPrice.toFixed(2)}</div>
                    </div>
                </div>
                <div class="info-group">
                    <label>Payment Method:</label>
                    <span>${order.paymentMethod}</span>
                </div>
                <div class="info-group">
                    <label>Date:</label>
                    <span>${formatDate(order.createdAt)}</span>
                </div>
                ${order.proofUrl ? `
                    <div class="info-group">
                        <label>Payment Proof:</label>
                        <a href="${order.proofUrl}" target="_blank" class="proof-link">View Proof</a>
                    </div>
                ` : ''}
            </div>
            <div class="order-actions">
                ${getActionButtons(order)}
            </div>
        </div>
    `;
}

// Add this function to update the listings table
function updateListingsTable(listings) {
    const tableBody = document.querySelector('#listings-section table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    listings.forEach(listing => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>
                <div class="listing-info">
                    <img src="${listing.image_url}" alt="${listing.title}" class="listing-thumbnail">
                    <span>${listing.title}</span>
                </div>
            </td>
            <td>$${listing.price.toFixed(2)}</td>
            <td>
                <span class="status-badge ${listing.status.toLowerCase()}">
                    ${listing.status}
                </span>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="editListing('${listing.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteListing('${listing.id}')">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
            <td>
                <button class="action-btn info-btn" onclick="viewListingDetails('${listing.id}')">
                    <i class="fas fa-info-circle"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Add these helper functions for listing management
async function editListing(listingId) {
    // Implementation for editing a listing
    showAlert('Edit functionality coming soon', 'info');
}

async function deleteListing(listingId) {
    if (!confirm('Are you sure you want to delete this listing?')) return;

    try {
        const { error } = await supabase
            .from('listings')
            .delete()
            .eq('id', listingId);

        if (error) throw error;
        showAlert('Listing deleted successfully', 'success');
        initializeListingsListener();
    } catch (error) {
        console.error('Error deleting listing:', error);
        showAlert('Error deleting listing: ' + error.message, 'error');
    }
}

async function viewListingDetails(listingId) {
    try {
        const { data: listing, error } = await supabase
            .from('listings')
            .select('*')
            .eq('id', listingId)
            .single();

        if (error) throw error;
        
        // Create and show the listing details modal
        // Implementation depends on your UI requirements
        showAlert('View details functionality coming soon', 'info');
    } catch (error) {
        console.error('Error viewing listing details:', error);
        showAlert('Error loading listing details', 'error');
    }
}

// Add function to update users table
function updateUsersTable(users) {
    const tableBody = document.querySelector('#users-section table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    users.forEach(user => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.username}</td>
            <td>$${user.balance?.toFixed(2) || '0.00'}</td>
            <td>
                <span class="status-badge ${user.status?.toLowerCase() || 'active'}">
                    ${user.status || 'Active'}
                </span>
            </td>
            <td>
                <button class="action-btn edit-btn" onclick="editUser('${user.id}')">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="action-btn ban-btn" onclick="banUser('${user.id}')">
                    <i class="fas fa-ban"></i>
                </button>
            </td>
            <td>
                <button class="action-btn info-btn" onclick="viewUserDetails('${user.id}')">
                    <i class="fas fa-info-circle"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// Add function to update payments table
function updatePaymentsTable(payments) {
    const tableBody = document.querySelector('#payments-section table tbody');
    if (!tableBody) return;

    tableBody.innerHTML = '';
    
    payments.forEach(payment => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>#${payment.id.slice(-6).toUpperCase()}</td>
            <td>${payment.username}</td>
            <td>$${payment.amount.toFixed(2)}</td>
            <td>${payment.payment_method}</td>
            <td>
                <span class="status-badge ${payment.status.toLowerCase()}">
                    ${payment.status}
                </span>
            </td>
            <td>${new Date(payment.created_at).toLocaleString()}</td>
            <td>
                <button class="action-btn info-btn" onclick="viewPaymentDetails('${payment.id}')">
                    <i class="fas fa-info-circle"></i>
                </button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

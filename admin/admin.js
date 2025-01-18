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

// Initialize Firebase at the top of the file
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
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Add showAlert function
function showAlert(message, type = 'info') {
    const existingAlert = document.querySelector('.custom-alert');
    if (existingAlert) {
        existingAlert.remove();
    }

    const alert = document.createElement('div');
    alert.className = `custom-alert ${type}`;
    
    let icon = 'info-circle';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'exclamation-circle';

    alert.innerHTML = `
        <i class="fas fa-${icon} alert-icon"></i>
        <div class="alert-content">${message}</div>
        <div class="alert-close">
            <i class="fas fa-times"></i>
        </div>
    `;

    document.body.appendChild(alert);
    setTimeout(() => alert.classList.add('show'), 10);

    alert.querySelector('.alert-close').onclick = () => {
        alert.classList.remove('show');
        setTimeout(() => alert.remove(), 300);
    };

    setTimeout(() => {
        if (alert.parentElement) {
            alert.classList.remove('show');
            setTimeout(() => alert.remove(), 300);
        }
    }, 5000);
}

// Product page specific functions
let currentPurchase = {
    id: null,
    price: 0,
    title: '',
    duration: null,
    paymentMethod: null,
    proofUrl: null
};

let currentDiscount = {
    code: null,
    percentage: 0
};

function showPaymentMethods() {
    const username = localStorage.getItem('currentUser');
    if (!username) {
        window.location.href = '/login/';
        return;
    }

    const modal = document.querySelector('.modal');
    const details = document.getElementById('purchase-details');
    
    // Show pricing options first if no plan is selected
    if (!currentPurchase.duration) {
        details.innerHTML = `
            <h3>Choose Your Plan</h3>
            <p class="modal-subtitle">Select the perfect duration for your needs</p>
            
            <div class="pricing-grid">
                <div class="pricing-card" data-duration="day" onclick="selectPlan('day', 6)">
                    <div class="duration">24 Hours</div>
                    <div class="price">$6<span class="price-suffix">/day</span></div>
                    <ul class="features">
                        <li>Full Access</li>
                        <li>24/7 Support</li>
                        <li>Testing Plan</li>
                    </ul>
                </div>

                <div class="pricing-card" data-duration="week" onclick="selectPlan('week', 12)">
                    <div class="duration">1 Week</div>
                    <div class="price">$12<span class="price-suffix">/week</span></div>
                    <ul class="features">
                        <li>Full Access</li>
                        <li>24/7 Support</li>
                        <li>Weekly Updates</li>
                    </ul>
                </div>

                <div class="pricing-card" data-duration="month" onclick="selectPlan('month', 28)">
                    <div class="duration">1 Month</div>
                    <div class="price">$28<span class="price-suffix">/month</span></div>
                    <span class="tag popular-tag">Popular</span>
                    <ul class="features">
                        <li>Full Access</li>
                        <li>Priority Support</li>
                        <li>Monthly Updates</li>
                    </ul>
                </div>

                <div class="pricing-card" data-duration="threemonths" onclick="selectPlan('threemonths', 50)">
                    <div class="duration">3 Months</div>
                    <div class="price">$50<span class="price-suffix">/3mo</span></div>
                    <span class="tag best-value-tag">Best Value</span>
                    <ul class="features">
                        <li>Full Access</li>
                        <li>Priority Support</li>
                        <li>Quarterly Updates</li>
                    </ul>
                </div>

                <div class="pricing-card" data-duration="lifetime" onclick="selectPlan('lifetime', 120)">
                    <div class="duration">Lifetime</div>
                    <div class="price">$120<span class="price-suffix">/forever</span></div>
                    <ul class="features">
                        <li>Full Access</li>
                        <li>VIP Support</li>
                        <li>Lifetime Updates</li>
                    </ul>
                </div>
            </div>
        `;

        modal.style.display = 'flex';
        requestAnimationFrame(() => modal.classList.add('show'));
        return;
    }

    // If plan is selected, show payment methods
    db.collection('users').doc(username).get().then(doc => {
        const userData = doc.data();
        const userBalance = userData.balance || 0;
        
        const modalContent = document.querySelector('.modal-content');
        modalContent.classList.add('payment-view');
        
        details.innerHTML = `
            <div class="payment-section">
                <h3>Select Payment Method</h3>
                <div class="selected-plan">
                    <p>Selected Plan: ${currentPurchase.title}</p>
                    <p class="price-display">
                        ${currentDiscount.code ? `
                            <span class="original-price">$${currentPurchase.price}</span>
                            <span class="final-price">$${(currentPurchase.price * (1 - currentDiscount.percentage/100)).toFixed(2)}</span>
                        ` : `
                            <span class="final-price">$${currentPurchase.price}</span>
                        `}
                    </p>
                    ${currentDiscount.code ? `
                        <p class="discount-applied">
                            <i class="fas fa-tag"></i>
                            ${currentDiscount.percentage}% discount applied
                        </p>
                    ` : ''}
                </div>
                <div class="discount-section">
                    <div class="discount-input-group">
                        <input type="text" id="discount-code" placeholder="Have a discount code?">
                        <button id="apply-discount" onclick="applyDiscountCode()">
                            <i class="fas fa-tag"></i>
                            Apply
                        </button>
                    </div>
                    <div id="discount-message"></div>
                </div>
                <div class="payment-methods">
                    <div class="payment-option ${userBalance >= currentPurchase.price ? '' : 'disabled'}" 
                         onclick="${userBalance >= currentPurchase.price ? 'selectPaymentOption(\'balance\')' : ''}"
                         title="${userBalance >= currentPurchase.price ? '' : 'Insufficient balance'}">
                        <i class="fas fa-wallet"></i>
                        Balance
                        ${userBalance < currentPurchase.price ? 
                            `<span class="insufficient-funds">$${userBalance.toFixed(2)}</span>` : 
                            `<span class="balance-amount">$${userBalance.toFixed(2)}</span>`}
                    </div>
                    <div class="payment-option" onclick="selectPaymentOption('cashapp')">
                        <i class="fas fa-dollar-sign"></i>
                        CashApp
                    </div>
                    <div class="payment-option" onclick="selectPaymentOption('paypal')">
                        <i class="fab fa-paypal"></i>
                        PayPal
                    </div>
                    <div class="payment-option" onclick="selectPaymentOption('crypto')">
                        <i class="fab fa-bitcoin"></i>
                        Crypto
                    </div>
                </div>
            </div>
        `;
    });

    // Show the discount section after pricing selection
    document.querySelector('.discount-section').style.display = 'block';
}

// Add new function to handle plan selection
function selectPlan(duration, price) {
    currentPurchase.duration = duration;
    currentPurchase.price = price;
    currentPurchase.title = `Fortnite DMA Cheat - ${duration.charAt(0).toUpperCase() + duration.slice(1)}`;
    
    // Remove previous selection
    document.querySelectorAll('.pricing-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selected class to clicked card
    document.querySelector(`[data-duration="${duration}"]`).classList.add('selected');
    
    // Show payment methods after a short delay
    setTimeout(() => {
        showPaymentMethods();
    }, 300);
}

// Add new function to handle pricing selection
function selectPricing(duration, price) {
    currentPurchase.duration = duration;
    currentPurchase.price = price;
    currentPurchase.title = `Fortnite DMA Cheat - ${duration.charAt(0).toUpperCase() + duration.slice(1)}`;

    const username = localStorage.getItem('currentUser');
    
    db.collection('users').doc(username).get().then(doc => {
        const userData = doc.data();
        const userBalance = userData.balance || 0;
        
        const details = document.getElementById('purchase-details');
        details.innerHTML = `
            <h3>Select Payment Method</h3>
            <div class="selected-plan">
                <p>Selected Plan: ${currentPurchase.title}</p>
                <p>Price: $${currentPurchase.price}</p>
            </div>
            <div class="payment-methods">
                <div class="payment-option ${userBalance >= currentPurchase.price ? '' : 'disabled'}" 
                     onclick="${userBalance >= currentPurchase.price ? 'selectPaymentOption(\'balance\')' : ''}"
                     title="${userBalance >= currentPurchase.price ? '' : 'Insufficient balance'}">
                    <i class="fas fa-wallet"></i>
                    Balance
                    ${userBalance < currentPurchase.price ? 
                        `<span class="insufficient-funds">$${userBalance.toFixed(2)}</span>` : 
                        `<span class="balance-amount">$${userBalance.toFixed(2)}</span>`}
                </div>
                <div class="payment-option" onclick="selectPaymentOption('cashapp')">
                    <i class="fas fa-dollar-sign"></i>
                    CashApp
                </div>
                <div class="payment-option" onclick="selectPaymentOption('paypal')">
                    <i class="fab fa-paypal"></i>
                    PayPal
                </div>
                <div class="payment-option" onclick="selectPaymentOption('crypto')">
                    <i class="fab fa-bitcoin"></i>
                    Crypto
                </div>
            </div>
        `;
    });
}

async function selectPaymentOption(method) {
    if (method === 'balance') {
        processBalancePayment();
        return;
    }

    // Hide the discount section
    const discountSection = document.querySelector('.discount-section');
    if (discountSection) {
        discountSection.style.display = 'none';
    }

    const paymentInfo = document.getElementById('payment-info');
    paymentInfo.style.display = 'block';
    paymentInfo.innerHTML = `
        <div class="payment-details">
            <h3>
                <i class="${
                    method === 'cashapp' ? 'fas fa-dollar-sign' : 
                    method === 'paypal' ? 'fab fa-paypal' : 
                    method === 'crypto' ? 'fab fa-bitcoin' : 
                    'fas fa-money-bill-wave'
                }"></i>
                ${method.charAt(0).toUpperCase() + method.slice(1)} Payment
            </h3>
            <div class="selected-plan">
                <p>Selected Plan: ${currentPurchase.title}</p>
                <p class="price-display">
                    ${currentDiscount.code ? `
                        <span class="original-price">$${currentPurchase.price}</span>
                        <span class="final-price">$${(currentPurchase.price * (1 - currentDiscount.percentage/100)).toFixed(2)}</span>
                    ` : `
                        <span class="final-price">$${currentPurchase.price}</span>
                    `}
                </p>
                ${currentDiscount.code ? `
                    <p class="discount-applied">
                        <i class="fas fa-tag"></i>
                        ${currentDiscount.percentage}% discount applied
                    </p>
                ` : ''}
            </div>
            <div class="proof-upload">
                <div class="proof-upload-icon">
                    <i class="fas fa-cloud-upload-alt upload-icon"></i>
                    <span>Upload</span>
                </div>
                <div class="proof-upload-content">
                    <p>Upload your payment proof here</p>
                    <p>Supported formats: PNG, JPG, JPEG</p>
                    <input type="file" id="payment-proof" accept="image/*">
                </div>
            </div>
            <button onclick="handlePaymentSubmission()" class="submit-btn">
                <i class="fas fa-check-circle"></i>
                Submit Payment
            </button>
        </div>
    `;
}

async function processBalancePayment() {
    try {
        const username = localStorage.getItem('currentUser');
        const userDoc = await db.collection('users').doc(username).get();
        const userData = userDoc.data();
        
        if (userData.balance < currentPurchase.price) {
            showAlert('Insufficient balance', 'error');
            return;
        }

        // Create order
        const orderData = {
            userId: username,
            username: userData.username,
            userAvatar: userData.discordAvatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png',
            discordId: userData.discordId,
            discordUsername: userData.discordUsername,
            listingId: currentPurchase.id,
            listingTitle: currentPurchase.title,
            price: currentPurchase.price,
            paymentMethod: 'balance',
            status: 'Pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            ip: userData.ip,
            quantity: 1,
            adminViewed: false,
            adminId: null,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
            notes: '',
            orderNumber: Date.now().toString(36).toUpperCase()
        };

        await db.collection('orders').add(orderData);

        // Update user balance
        await db.collection('users').doc(username).update({
            balance: firebase.firestore.FieldValue.increment(-currentPurchase.price)
        });

        // Refresh the displayed balance
        document.querySelector('.balance-amount').textContent = 
            `$${(userData.balance - currentPurchase.price).toFixed(2)}`;

        // Show success message without closing modal
        showSuccessMessage();

    } catch (error) {
        console.error('Error processing balance payment:', error);
        showAlert('Error processing payment: ' + error.message, 'error');
    }
}

async function handlePaymentSubmission() {
    try {
        const username = localStorage.getItem('currentUser');
        const userDoc = await db.collection('users').doc(username).get();
        
        if (!userDoc.exists) {
            showAlert('Error: User data not found', 'error');
            return;
        }

        const userData = userDoc.data();
        let proofUrl = null;

        if (currentPurchase.paymentMethod !== 'balance') {
            const proofInput = document.getElementById('payment-proof');
            if (!proofInput || !proofInput.files || !proofInput.files[0]) {
                showAlert('Please upload payment proof', 'error');
                return;
            }
            proofUrl = await uploadToLitterbox(proofInput.files[0]);
        }

        // Create the order
        const orderData = {
            userId: username,
            username: userData.username,
            userAvatar: userData.discordAvatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png',
            discordId: userData.discordId,
            discordUsername: userData.discordUsername,
            listingId: currentPurchase.id,
            listingTitle: currentPurchase.title,
            price: currentPurchase.price,
            paymentMethod: currentPurchase.paymentMethod,
            proofUrl: proofUrl,
            status: 'Pending',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            ip: userData.ip,
            quantity: 1,
            adminViewed: false,
            adminId: null,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
            notes: '',
            orderNumber: Date.now().toString(36).toUpperCase(),
            originalPrice: currentPurchase.originalPrice || currentPurchase.price,
            finalPrice: currentPurchase.finalPrice || currentPurchase.price,
            appliedDiscount: currentPurchase.appliedDiscount || null
        };

        await db.collection('orders').add(orderData);

        // Show success message without closing modal
        showSuccessMessage();
        
    } catch (error) {
        console.error('Error:', error);
        showAlert('Error processing order: ' + error.message, 'error');
    }
}

async function uploadToLitterbox(file) {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    formData.append('time', '72h');
    formData.append('fileToUpload', file);

    const response = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
        method: 'POST',
        body: formData
    });

    if (!response.ok) {
        throw new Error('Failed to upload proof image');
    }

    const imageUrl = await response.text();
    return imageUrl.trim();
}

function showSuccessMessage() {
    const modal = document.querySelector('.modal');
    const content = document.querySelector('.modal-content');
    
    content.innerHTML = `
        <div class="success-message">
            <div class="success-icon">
                <i class="fas fa-check-circle"></i>
            </div>
            <h2>Thank you for your purchase!</h2>
            <p class="success-subtitle">Your order has been submitted successfully.</p>
            <div class="order-status">
                <i class="fas fa-clock"></i>
                <span>Awaiting admin approval</span>
            </div>
            <div class="success-buttons">
                <button class="return-btn" onclick="window.location.href='/dashboard/'">
                    <i class="fas fa-home"></i>
                    Dashboard
                </button>
                <button class="close-btn" onclick="closeModal()">
                    <i class="fas fa-times"></i>
                    Close
                </button>
            </div>
        </div>
    `;

    // Add these styles to the success message
    const style = document.createElement('style');
    style.textContent = `
        .success-message {
            text-align: center;
            padding: 2.5rem;
            color: white;
            background: linear-gradient(165deg, rgba(26, 26, 26, 0.95), rgba(20, 20, 20, 0.95));
            border-radius: 20px;
            border: 1px solid rgba(107, 70, 193, 0.2);
            backdrop-filter: blur(10px);
        }

        .success-icon {
            width: 80px;
            height: 80px;
            background: linear-gradient(135deg, #6b46c1, #805ad5);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1.5rem;
            box-shadow: 0 10px 20px -10px rgba(107, 70, 193, 0.5);
            animation: scaleIn 0.5s ease;
        }

        .success-icon i {
            font-size: 2.5rem;
            color: white;
            animation: checkmark 0.5s ease-in-out 0.2s both;
        }

        .success-message h2 {
            font-size: 1.8rem;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, #fff, #e2e8f0);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            animation: fadeInUp 0.5s ease 0.3s both;
        }

        .success-subtitle {
            font-size: 1.1rem;
            color: rgba(255, 255, 255, 0.9);
            margin-bottom: 1.5rem;
            animation: fadeInUp 0.5s ease 0.4s both;
        }

        .order-status {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.75rem 1.5rem;
            background: rgba(107, 70, 193, 0.1);
            border: 1px solid rgba(107, 70, 193, 0.2);
            border-radius: 12px;
            margin-bottom: 2rem;
            animation: fadeInUp 0.5s ease 0.5s both;
        }

        .order-status i {
            color: #6b46c1;
        }

        .success-buttons {
            display: flex;
            gap: 1rem;
            justify-content: center;
            animation: fadeInUp 0.5s ease 0.6s both;
        }
        
        .success-buttons button {
            padding: 0.75rem 1.5rem;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .return-btn {
            background: linear-gradient(135deg, #6b46c1, #805ad5);
            color: white;
            box-shadow: 0 5px 15px -5px rgba(107, 70, 193, 0.4);
        }
        
        .close-btn {
            background: rgba(255, 255, 255, 0.05);
            color: white;
            border: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        .success-buttons button:hover {
            transform: translateY(-2px);
        }
        
        .return-btn:hover {
            box-shadow: 0 10px 20px -10px rgba(107, 70, 193, 0.6);
        }
        
        .close-btn:hover {
            background: rgba(255, 255, 255, 0.1);
        }

        @keyframes scaleIn {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }

        @keyframes checkmark {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }

        @keyframes fadeInUp {
            from { 
                transform: translateY(20px);
                opacity: 0;
            }
            to {
                transform: translateY(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);
}

// Add closeModal function
function closeModal() {
    const modal = document.querySelector('.modal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Make closeModal globally available
window.closeModal = closeModal;

// Make functions globally available
window.showPaymentMethods = showPaymentMethods;
window.selectPaymentOption = selectPaymentOption;
window.handlePaymentSubmission = handlePaymentSubmission;
window.selectPricing = selectPricing;

// Add new function to handle discount codes
async function applyDiscountCode() {
    const discountCode = document.getElementById('discount-code').value.trim().toUpperCase();
    const discountMessage = document.getElementById('discount-message');
    const applyButton = document.getElementById('apply-discount');
    
    if (!discountCode) {
        showDiscountMessage('Please enter a discount code', 'error');
        return;
    }

    // Disable button and show loading state
    applyButton.disabled = true;
    applyButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Applying...';

    try {
        // Query Firebase for the discount code
        const discountSnapshot = await db.collection('discountCodes')
            .where('code', '==', discountCode)
            .where('active', '==', true)
            .get();

        if (discountSnapshot.empty) {
            showDiscountMessage('Invalid or expired discount code', 'error');
            currentDiscount = { code: null, percentage: 0 };
        } else {
            const discountData = discountSnapshot.docs[0].data();
            currentDiscount = {
                code: discountCode,
                percentage: discountData.percentage
            };
            
            // Update the displayed price
            updatePriceWithDiscount();
            showDiscountMessage(`Discount applied: ${discountData.percentage}% off!`, 'success');
        }
    } catch (error) {
        console.error('Error applying discount:', error);
        showDiscountMessage('Error applying discount code', 'error');
    } finally {
        // Reset button state
        applyButton.disabled = false;
        applyButton.innerHTML = '<i class="fas fa-tag"></i> Apply';
    }
}

// Helper function to show discount messages
function showDiscountMessage(message, type) {
    const discountMessage = document.getElementById('discount-message');
    discountMessage.className = type;
    discountMessage.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
        ${message}
    `;
}

// Function to update price display with discount
function updatePriceWithDiscount() {
    if (!currentPurchase.price) return;

    const selectedPlan = document.querySelector('.selected-plan');
    if (!selectedPlan) return;

    const originalPrice = currentPurchase.price;
    const discountAmount = (originalPrice * currentDiscount.percentage) / 100;
    const finalPrice = originalPrice - discountAmount;

    // Update the price display
    selectedPlan.innerHTML = `
        <p>Selected Plan: ${currentPurchase.title}</p>
        <div class="price-with-discount">
            <p class="original-price">$${originalPrice.toFixed(2)}</p>
            <p class="discounted-price">$${finalPrice.toFixed(2)}</p>
        </div>
        ${currentDiscount.code ? `<p class="discount-applied">Discount: ${currentDiscount.percentage}% off</p>` : ''}
    `;

    // Update the current purchase price
    currentPurchase.originalPrice = originalPrice;
    currentPurchase.finalPrice = finalPrice;
    currentPurchase.appliedDiscount = currentDiscount;
}

// Make the new function globally available
window.applyDiscountCode = applyDiscountCode; 
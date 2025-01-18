// Get existing Firebase app or initialize new one
let app;
let db;

try {
    app = firebase.app();
    db = firebase.firestore();
} catch (error) {
    // Only initialize if no Firebase app exists
    const firebaseConfig = {
        apiKey: "AIzaSyDvG4059xSr2jToP9xDz-8dlxbumuRzdUE",
        authDomain: "sdfkj238j98sdlkmzlknslaksdjfkl.firebaseapp.com",
        projectId: "sdfkj238j98sdlkmzlknslaksdjfkl",
        storageBucket: "sdfkj238j98sdlkmzlknslaksdjfkl.firebasestorage.app",
        messagingSenderId: "778178162130",
        appId: "1:778178162130:web:a9513f09e404813aa2ec0b",
        measurementId: "G-WP6QR49WZ3"
    };

    app = firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
}

// Initialize currentPurchase object
let currentPurchase = {
    id: null,
    price: 0,
    title: '',
    duration: null,
    paymentMethod: null,
    proofUrl: null
};

// Add view state tracking
let currentView = 'pricing'; // 'pricing', 'payment', 'details'

// Add navigation history tracking
let navigationHistory = ['pricing'];

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
let currentDiscount = {
    code: null,
    percentage: 0
};

function showPaymentMethods() {
    navigationHistory.push('payment');
    currentView = 'payment';
    const username = localStorage.getItem('currentUser');
    if (!username) {
        window.location.href = '/login/';
        return;
    }

    // Get modal elements with error handling
    const modal = document.querySelector('.modal');
    const details = document.getElementById('purchase-details');
    
    // Check if elements exist
    if (!modal || !details) {
        console.error('Modal elements not found');
        return;
    }

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

        // Safely show modal
        modal.style.display = 'flex';
        // Use requestAnimationFrame to ensure display change has taken effect
        requestAnimationFrame(() => {
            modal.classList.add('show');
        });
        return;
    }

    // If plan is selected, show payment methods
    db.collection('users').doc(username).get().then(doc => {
        if (!doc.exists) {
            console.error('User document not found');
            return;
        }

        const userData = doc.data();
        const userBalance = userData.balance || 0;
        
        const modalContent = document.querySelector('.modal-content');
        if (!modalContent) {
            console.error('Modal content element not found');
            return;
        }
        
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

        // Show the discount section if it exists
        const discountSection = document.querySelector('.discount-section');
        if (discountSection) {
            discountSection.style.display = 'block';
        }
    }).catch(error => {
        console.error('Error fetching user data:', error);
        showAlert('Error loading payment methods. Please try again.', 'error');
    });
}

// Add new function to handle plan selection
function selectPlan(duration, price) {
    navigationHistory.push('payment');
    currentPurchase.duration = duration;
    currentPurchase.price = price;
    currentPurchase.title = `Fortnite DMA Cheat - ${duration.charAt(0).toUpperCase() + duration.slice(1)}`;
    
    // Remove previous selection
    document.querySelectorAll('.pricing-card').forEach(card => {
        card.classList.remove('selected');
    });
    
    // Add selected class to clicked card
    const selectedCard = document.querySelector(`[data-duration="${duration}"]`);
    if (selectedCard) {
        selectedCard.classList.add('selected');
    }
    
    // Show payment methods after a short delay with error handling
    setTimeout(() => {
        try {
            showPaymentMethods();
        } catch (error) {
            console.error('Error showing payment methods:', error);
            showAlert('Error loading payment options. Please try again.', 'error');
        }
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
    // Update the current purchase payment method
    currentPurchase.paymentMethod = method;
    
    // Remove active class from all payment options
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.classList.remove('active');
    });
    
    // Add active class to selected option
    const selectedOption = document.querySelector(`.payment-option[onclick*="${method}"]`);
    if (selectedOption) {
        selectedOption.classList.add('active');
    }
    
    // Remove existing continue button if it exists
    const existingBtn = document.querySelector('.continue-payment-btn');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    // Add new continue button
    const continueBtn = document.createElement('button');
    continueBtn.className = 'continue-payment-btn';
    continueBtn.innerHTML = `
        <i class="fas fa-arrow-right"></i>
        Continue to Payment
    `;
    continueBtn.onclick = () => showPaymentDetails(method);
    
    // Insert after payment methods
    const paymentMethods = document.querySelector('.payment-methods');
    paymentMethods.insertAdjacentElement('afterend', continueBtn);
}

// Add new function to show payment details
function showPaymentDetails(method) {
    navigationHistory.push('details');
    // Hide previous elements
    const paymentMethods = document.querySelector('.payment-methods');
    const continueBtn = document.querySelector('.continue-payment-btn');
    if (paymentMethods) paymentMethods.style.display = 'none';
    if (continueBtn) continueBtn.style.display = 'none';

    // Calculate fees and discounts
    const fees = {
        cashapp: 0.05,
        paypal: 0.07,
        crypto: 0,
        balance: 0
    };

    const feeRate = fees[method];
    const originalPrice = currentPurchase.price;
    const discountAmount = currentDiscount.code ? (originalPrice * currentDiscount.percentage/100) : 0;
    const subtotalAfterDiscount = originalPrice - discountAmount;
    const feeAmount = subtotalAfterDiscount * feeRate;
    const totalPrice = subtotalAfterDiscount + feeAmount;

    // Get payment info based on method
    const paymentInfo = {
        cashapp: {
            address: '$gu2u',
            instructions: 'Only when <a href="https://discordapp.com/users/1308104217998921799" style="color: #6b46c1; text-decoration: none;">@lite</a> is online'
        },
        paypal: {
            address: 'PayPal.me/ledallaaa',
            instructions: 'Send as Friends & Family. Do not include any notes.'
        },
        crypto: {
            btc: "bc1qs3x0dj4pzhxtq0e26x7uhdehuhlqqsvvx4843f",
            eth: "0x2C71Ee68A9Ec269377FCb49f04Ebf97c1241bBda",
            ltc: "LbXhE3tmkyiPNHwnojfLh9jB7u3XBhGRJK",
            instructions: 'Select your preferred cryptocurrency below.'
        }
    };

    const details = document.getElementById('purchase-details');
    details.innerHTML = `
        <div class="payment-details-container">
            <div class="order-summary">
                <h3>Order Summary</h3>
                <div class="price-breakdown">
                    <div class="price-row">
                        <span>Subtotal:</span>
                        <span>$${originalPrice.toFixed(2)}</span>
                    </div>
                    ${currentDiscount.code ? `
                        <div class="price-row discount">
                            <span>Discount (${currentDiscount.percentage}%):</span>
                            <span>-$${discountAmount.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div class="price-row">
                        <span>Fee (${(feeRate * 100).toFixed(0)}%):</span>
                        <span>$${feeAmount.toFixed(2)}</span>
                    </div>
                    <div class="price-row total">
                        <span>Total:</span>
                        <span>$${totalPrice.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div class="payment-instructions">
                <h3>Payment Details</h3>
                ${method === 'crypto' ? `
                    <select id="crypto-select" class="crypto-select">
                        <option value="">Select cryptocurrency...</option>
                        <option value="btc">Bitcoin (BTC)</option>
                        <option value="eth">Ethereum (ETH)</option>
                        <option value="ltc">Litecoin (LTC)</option>
                    </select>
                    <div id="crypto-address" class="payment-address"></div>
                ` : `
                    <div class="payment-address">
                        ${paymentInfo[method].address}
                        <button onclick="copyToClipboard('${paymentInfo[method].address}')" class="copy-btn">
                            <i class="fas fa-copy"></i> Copy
                        </button>
                    </div>
                `}
                <p class="instructions-text">${paymentInfo[method].instructions}</p>
            </div>

            <div class="proof-upload">
                <input type="file" id="payment-proof" accept="image/*" required placeholder="Upload Payment Proof">
            </div>

            <div class="action-buttons">
                <button onclick="handlePaymentSubmission()" class="submit-btn">
                    <i class="fas fa-check"></i>
                    Submit Payment
                </button>
            </div>
        </div>
    `;

    // Add crypto select handler if crypto payment
    if (method === 'crypto') {
        document.getElementById('crypto-select').addEventListener('change', function(e) {
            const selectedCrypto = e.target.value;
            const addressDiv = document.getElementById('crypto-address');
            if (selectedCrypto) {
                addressDiv.innerHTML = `
                    ${paymentInfo.crypto[selectedCrypto]}
                    <button onclick="copyToClipboard('${paymentInfo.crypto[selectedCrypto]}')" class="copy-btn">
                        <i class="fas fa-copy"></i> Copy
                    </button>
                `;
            }
        });
    }
}

// Add helper functions
function backToPaymentMethods() {
    // Remove current page from history
    navigationHistory.pop();
    
    // Get the previous page
    const previousPage = navigationHistory[navigationHistory.length - 1];
    
    // Handle navigation based on previous page
    switch (previousPage) {
        case 'pricing':
            const details = document.getElementById('purchase-details');
            details.style.opacity = '0';
            
            setTimeout(() => {
                showPricingOptions();
                details.style.opacity = '1';
            }, 200);
            break;
            
        case 'payment':
            const paymentMethods = document.querySelector('.payment-methods');
            const continueBtn = document.querySelector('.continue-payment-btn');
            const discountSection = document.querySelector('.discount-section');
            const paymentDetails = document.getElementById('purchase-details');
            
            // Fade out current view
            paymentDetails.style.opacity = '0';
            
            setTimeout(() => {
                // Clear payment details
                paymentDetails.innerHTML = '';
                
                // Show original elements
                if (paymentMethods) {
                    paymentMethods.style.display = 'grid';
                    paymentMethods.style.opacity = '1';
                }
                if (discountSection) {
                    discountSection.style.display = 'block';
                    discountSection.style.opacity = '1';
                }
                if (continueBtn) {
                    continueBtn.style.display = 'flex';
                    continueBtn.style.opacity = '1';
                }
            }, 200);
            break;
            
        default:
            // If somehow we don't have a valid previous page, go back to pricing
            navigationHistory = ['pricing'];
            showPricingOptions();
            break;
    }
}

function backToPaymentConfirmation() {
    selectPaymentOption(currentPurchase.paymentMethod);
}

function updateCryptoAddress() {
    const select = document.getElementById('crypto-select');
    const addressDiv = document.getElementById('crypto-address');
    const selectedCrypto = select.value;
    
    if (selectedCrypto) {
        const address = paymentAddresses.crypto[selectedCrypto];
        addressDiv.innerHTML = `
            ${address}
            <button onclick="copyToClipboard('${address}')" class="copy-btn">
                <i class="fas fa-copy"></i> Copy
            </button>
        `;
    } else {
        addressDiv.innerHTML = '';
    }
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showAlert('Address copied to clipboard!', 'success');
    }).catch(() => {
        showAlert('Failed to copy address', 'error');
    });
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

        // Calculate final price with discounts and fees
        const originalPrice = currentPurchase.price;
        const discountAmount = currentDiscount.code ? (originalPrice * currentDiscount.percentage / 100) : 0;
        const subtotalAfterDiscount = originalPrice - discountAmount;
        
        // Fee rates based on payment method
        const feeRates = {
            cashapp: 0.05, // 5%
            paypal: 0.07,  // 7%
            crypto: 0,     // 0%
            balance: 0     // 0%
        };
        
        const feeRate = feeRates[currentPurchase.paymentMethod] || 0;
        const feeAmount = subtotalAfterDiscount * feeRate;
        const finalPrice = Number((subtotalAfterDiscount + feeAmount).toFixed(2)); // Format to 2 decimal places

        // Create the order
        const orderData = {
            userId: username,
            username: userData.username,
            userAvatar: userData.discordAvatarURL || 'https://cdn.discordapp.com/embed/avatars/0.png',
            discordId: userData.discordId,
            discordUsername: userData.discordUsername,
            listingId: currentPurchase.id,
            listingTitle: currentPurchase.title,
            originalPrice: Number(originalPrice.toFixed(2)), // Format original price
            price: finalPrice, // Already formatted final price
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
            appliedDiscount: currentDiscount.code ? {
                code: currentDiscount.code,
                percentage: currentDiscount.percentage
            } : null,
            fees: {
                rate: feeRate,
                amount: Number(feeAmount.toFixed(2)) // Format fee amount
            }
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
            .get();

        if (discountSnapshot.empty) {
            showDiscountMessage('Invalid discount code', 'error');
            currentDiscount = { code: null, percentage: 0 };
            return;
        }

        const discountDoc = discountSnapshot.docs[0];
        const discount = discountDoc.data();
        const now = new Date();

        // Check if code is expired
        if (discount.validUntil?.toDate() < now) {
            showDiscountMessage('This discount code has expired', 'error');
            currentDiscount = { code: null, percentage: 0 };
            return;
        }

        // Check if max uses reached
        if (discount.currentUses >= discount.maxUses) {
            showDiscountMessage('This discount code has reached its maximum uses', 'error');
            currentDiscount = { code: null, percentage: 0 };
            return;
        }

        // Increment the usage count in Firebase
        await db.collection('discountCodes').doc(discountDoc.id).update({
            currentUses: firebase.firestore.FieldValue.increment(1)
        });

        // Log the usage in discountUsages collection
        await db.collection('discountUsages').add({
            discountId: discountDoc.id,
            discountCode: discountCode,
            userId: localStorage.getItem('currentUser'),
            usedAt: firebase.firestore.FieldValue.serverTimestamp(),
            percentage: discount.percentage,
            maxUses: discount.maxUses,
            currentUses: discount.currentUses + 1
        });

        // Update current discount
        currentDiscount = {
            code: discountCode,
            percentage: discount.percentage,
            docId: discountDoc.id
        };
            
        // Update the displayed price
        updatePriceWithDiscount();
        showDiscountMessage(`${discount.percentage}% discount applied!`, 'success');

    } catch (error) {
        console.error('Error applying discount:', error);
        showDiscountMessage('Error applying discount code', 'error');
        currentDiscount = { code: null, percentage: 0 };
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

// Make sure modal close functionality is properly initialized
document.addEventListener('DOMContentLoaded', () => {
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', () => {
            const modal = document.querySelector('.modal');
            if (modal) {
                modal.classList.remove('show');
                setTimeout(() => {
                    modal.style.display = 'none';
                }, 300);
            }
        });
    }
}); 

function selectPayment(option) {
    // ... existing code ...
    
    // Remove active class from all options
    document.querySelectorAll('.payment-option').forEach(opt => {
        opt.classList.remove('active');
    });
    
    // Add active class to selected option
    document.querySelector(`[data-payment="${option}"]`).classList.add('active');
    
    // Show continue button
    const continueBtn = document.querySelector('.continue-btn');
    if (!continueBtn) {
        const btn = document.createElement('button');
        btn.className = 'continue-btn';
        btn.innerHTML = 'Continue';
        btn.onclick = () => {
            // Handle continue action here
            processPayment(option);
        };
        document.querySelector('.payment-options').insertAdjacentElement('afterend', btn);
    }
    
    // ... existing code ...
}

function processPayment(paymentOption) {
    // Handle the payment processing based on selected option
    console.log(`Processing payment with ${paymentOption}`);
    // Add your payment processing logic here
} 

// Add new function to show pricing options
function showPricingOptions() {
    const details = document.getElementById('purchase-details');
    
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
            <!-- ... rest of pricing cards ... -->
        </div>
    `;

    // Reset any existing selections
    currentPurchase.duration = null;
    currentPurchase.price = 0;
    currentPurchase.paymentMethod = null;
} 

// Add this function to validate and apply discount codes
async function validateDiscountCode(code) {
    try {
        const discountSnapshot = await db.collection('discountCodes')
            .where('code', '==', code.toUpperCase())
            .get();

        if (discountSnapshot.empty) {
            return null;
        }

        const discount = discountSnapshot.docs[0].data();
        const now = new Date();
        const validUntil = discount.validUntil.toDate();

        // Check if code is expired
        if (validUntil < now) {
            return null;
        }

        // Check if max uses reached
        const usageCount = await db.collection('discountUsages')
            .where('discountCode', '==', code.toUpperCase())
            .get()
            .then(snapshot => snapshot.size);

        if (usageCount >= discount.maxUses) {
            return null;
        }

        return {
            id: discountSnapshot.docs[0].id,
            ...discount
        };
    } catch (error) {
        console.error('Error validating discount code:', error);
        return null;
    }
}

// Add this function to calculate discounted price
function calculateDiscountedPrice(originalPrice, discountPercentage) {
    const discount = (originalPrice * discountPercentage) / 100;
    return originalPrice - discount;
}

// Modify the createOrder function
async function createOrder(listingId, paymentMethod, proofUrl = null) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            showAlert('Please log in to make a purchase', 'error');
            return;
        }

        const listingDoc = await db.collection('listings').doc(listingId).get();
        if (!listingDoc.exists) {
            showAlert('Listing not found', 'error');
            return;
        }

        const listing = listingDoc.data();
        let finalPrice = listing.price;

        // Get discount code if applied
        const discountInput = document.getElementById('discount-code');
        if (discountInput && discountInput.value) {
            const discount = await validateDiscountCode(discountInput.value);
            if (discount) {
                finalPrice = calculateDiscountedPrice(listing.price, discount.percentage);
                
                // Record discount usage
                await db.collection('discountUsages').add({
                    discountCode: discount.code,
                    userId: user.uid,
                    usedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    orderId: null // Will update this after order creation
                });
            }
        }

        // Create the order with the final price
        const orderRef = await db.collection('orders').add({
            userId: user.uid,
            username: user.username,
            discordUsername: user.discordUsername,
            userAvatar: user.avatar,
            listingId: listingId,
            listingTitle: listing.title,
            price: finalPrice, // Use the discounted price
            originalPrice: listing.price, // Store original price for reference
            status: 'Pending',
            paymentMethod: paymentMethod,
            proofUrl: proofUrl,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });

        // Update the discount usage with the order ID if a discount was used
        if (discountInput && discountInput.value) {
            const discountUsageSnapshot = await db.collection('discountUsages')
                .where('userId', '==', user.uid)
                .where('orderId', '==', null)
                .orderBy('usedAt', 'desc')
                .limit(1)
                .get();

            if (!discountUsageSnapshot.empty) {
                await discountUsageSnapshot.docs[0].ref.update({
                    orderId: orderRef.id
                });
            }
        }

        showAlert('Order created successfully', 'success');
        return orderRef.id;
    } catch (error) {
        console.error('Error creating order:', error);
        showAlert('Error creating order: ' + error.message, 'error');
        return null;
    }
}

// Add this function to handle discount code input
async function handleDiscountCode() {
    const discountInput = document.getElementById('discount-code');
    const priceElement = document.getElementById('listing-price');
    const originalPrice = parseFloat(priceElement.dataset.originalPrice);

    if (!discountInput.value) {
        priceElement.textContent = `$${originalPrice.toFixed(2)}`;
        return;
    }

    const discount = await validateDiscountCode(discountInput.value);
    if (discount) {
        const discountedPrice = calculateDiscountedPrice(originalPrice, discount.percentage);
        priceElement.textContent = `$${discountedPrice.toFixed(2)} (${discount.percentage}% off)`;
        showAlert(`Discount code applied: ${discount.percentage}% off`, 'success');
    } else {
        priceElement.textContent = `$${originalPrice.toFixed(2)}`;
        showAlert('Invalid or expired discount code', 'error');
    }
} 
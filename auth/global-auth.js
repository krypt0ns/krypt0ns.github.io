// Create this new file
(function() {
    // Check credentials immediately
    function checkAuth() {
        const username = localStorage.getItem('currentUser');
        const password = localStorage.getItem('userPassword');
        
        if (!username || !password) {
            // Only redirect if we're not already on the login or register page
            if (!window.location.pathname.includes('/login/') && 
                !window.location.pathname.includes('/register/')) {
                window.location.replace('/login/');
            }
        }
    }

    // Check immediately
    checkAuth();

    // Check whenever storage changes
    window.addEventListener('storage', (e) => {
        if ((e.key === 'currentUser' || e.key === 'userPassword') && !e.newValue) {
            checkAuth();
        }
    });
})(); 